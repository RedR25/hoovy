"""Configure HuggingFace before any model library is imported.

Kokoro pulls ~325 MB of weights from HuggingFace on first run. The weights
are cached on disk, but `huggingface_hub` still hits the network on every
subsequent boot to check for a newer revision — which prints the noisy
"unauthenticated requests to HF Hub" warning and *looks* like a re-download.

We fix this by flipping HF Hub into offline mode once the cache is
populated. No network call, no auth warning, no false alarm. First run
still goes online so the model can actually be downloaded.

We intentionally do NOT override HF_HOME — that would force a re-download
into a project-local directory if the user already has weights cached at
the platform default (~/.cache/huggingface on Linux/Mac, %USERPROFILE%\\
.cache\\huggingface on Windows). We just detect the existing cache and
flip offline mode if it's populated.

We also silence two harmless torch warnings (LSTM dropout-with-1-layer and
deprecated weight_norm) that Kokoro's model definition triggers on every
load.

Import this module at the top of `app/main.py` BEFORE any other app
import. The side-effect call at the bottom of this file runs on first
import.
"""
from __future__ import annotations

import os
import warnings
from pathlib import Path


def _default_hf_cache_dir() -> Path:
    """Locate the HF cache without importing huggingface_hub.

    Matches huggingface_hub's resolution order: HF_HOME → HF_HUB_CACHE →
    XDG_CACHE_HOME/huggingface → ~/.cache/huggingface.
    """
    if env := os.environ.get("HF_HOME"):
        return Path(env)
    if env := os.environ.get("HF_HUB_CACHE"):
        # HF_HUB_CACHE points at the "hub" dir directly — step up one.
        return Path(env).parent
    if env := os.environ.get("XDG_CACHE_HOME"):
        return Path(env) / "huggingface"
    return Path.home() / ".cache" / "huggingface"


def _hf_cache_populated(hf_home: Path) -> bool:
    """True iff at least one model snapshot exists under <hf_home>/hub."""
    hub = hf_home / "hub"
    if not hub.is_dir():
        return False
    for child in hub.iterdir():
        if not (child.is_dir() and child.name.startswith("models--")):
            continue
        snapshots = child / "snapshots"
        if snapshots.is_dir() and any(snapshots.iterdir()):
            return True
    return False


def configure_hf_cache() -> None:
    cache_root = _default_hf_cache_dir()
    if _hf_cache_populated(cache_root):
        os.environ.setdefault("HF_HUB_OFFLINE", "1")
        os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

    warnings.filterwarnings(
        "ignore",
        message=r".*dropout option adds dropout after all but last recurrent layer.*",
        category=UserWarning,
    )
    warnings.filterwarnings(
        "ignore",
        message=r".*torch\.nn\.utils\.weight_norm.*",
        category=FutureWarning,
    )


configure_hf_cache()
