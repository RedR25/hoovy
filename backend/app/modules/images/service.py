"""ImageGenService — Gemini 2.5 Flash Image generation with Pillow fallback.

Cache strategy: write-once to disk. If the file exists and force=False, return
immediately without touching the API. This means images are generated at most
once per asset, ever — safe to run at startup or in a CLI script.

Placeholder mode (no GEMINI_API_KEY or mock_ai=True): renders a simple pastel
PNG via Pillow — solid background + scenario/step ID text. No external call.
"""
from __future__ import annotations

import asyncio
import base64
import io
import logging
from pathlib import Path
from typing import Literal

from app.core.config import get_settings
from app.modules.images.schemas import ImageGenerateResponse

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pillow placeholder generator
# ---------------------------------------------------------------------------

_PASTEL_COLORS = [
    (255, 223, 186),  # peach
    (186, 225, 255),  # sky blue
    (186, 255, 201),  # mint
    (255, 186, 255),  # lavender
    (255, 255, 186),  # yellow
]


def _make_placeholder_png(scenario_id: str, step_id: str, width: int = 512, height: int = 384) -> bytes:
    """Return PNG bytes of a colored placeholder with text overlay."""
    from PIL import Image, ImageDraw, ImageFont  # noqa: PLC0415

    # Deterministic color from scenario_id
    color = _PASTEL_COLORS[abs(hash(scenario_id)) % len(_PASTEL_COLORS)]
    img = Image.new("RGB", (width, height), color)
    draw = ImageDraw.Draw(img)

    # Try to use a default font, fall back to bitmap default
    try:
        font_large = ImageFont.truetype("arial.ttf", 32)
        font_small = ImageFont.truetype("arial.ttf", 20)
    except (OSError, IOError):
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    label1 = scenario_id
    label2 = step_id

    # Center text
    w1 = draw.textlength(label1, font=font_large) if hasattr(draw, "textlength") else len(label1) * 18
    w2 = draw.textlength(label2, font=font_small) if hasattr(draw, "textlength") else len(label2) * 12

    draw.text(((width - w1) / 2, height / 2 - 40), label1, fill=(80, 80, 80), font=font_large)
    draw.text(((width - w2) / 2, height / 2 + 10), label2, fill=(120, 120, 120), font=font_small)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Gemini call
# ---------------------------------------------------------------------------

def _call_gemini_sync(prompt: str, full_prompt: str) -> bytes | None:
    """Blocking Gemini image generation call. Returns PNG bytes or None."""
    import sys  # noqa: PLC0415

    settings = get_settings()
    try:
        from google import genai  # noqa: PLC0415

        client = genai.Client(api_key=settings.gemini_api_key)

        resp = client.models.generate_content(
            model=settings.gemini_image_model,
            contents=[full_prompt],
        )

        # Walk candidates → parts looking for inline image data
        for candidate in getattr(resp, "candidates", []):
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", []) if content else []
            for part in parts:
                inline = getattr(part, "inline_data", None)
                if inline is None:
                    continue
                mime = getattr(inline, "mime_type", "") or ""
                if not mime.startswith("image/"):
                    continue
                data = getattr(inline, "data", None)
                if data is None:
                    continue
                # data may already be bytes or a base64 string
                if isinstance(data, (bytes, bytearray)):
                    return bytes(data)
                # base64 string
                return base64.b64decode(data)

        # Loud diagnostic for the demo prep — show the raw response so a misconfigured
        # model or blocked prompt surfaces immediately instead of silently producing
        # placeholders. Print to stderr so it appears in the regen script output.
        msg = f"[gemini] NO IMAGE in response. model={settings.gemini_image_model} prompt={prompt[:80]!r}"
        print(msg, file=sys.stderr)
        try:
            print(f"[gemini] raw response: {resp!r}", file=sys.stderr)
        except Exception:
            pass
        logger.warning(msg)
        return None

    except Exception as exc:
        msg = f"[gemini] CALL FAILED ({type(exc).__name__}): {exc}"
        print(msg, file=sys.stderr)
        logger.warning(msg)
        return None


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class ImageGenService:
    """Generate and cache scenario images. Thread-safe (no shared mutable state)."""

    def _asset_path(
        self,
        images_dir: Path,
        scenario_id: str,
        step_id: str,
        kind: Literal["scene", "hint", "thumbnail"],
    ) -> Path:
        if kind == "thumbnail":
            return images_dir / scenario_id / "thumb.png"
        if kind == "hint":
            return images_dir / scenario_id / f"{step_id}-hint.png"
        return images_dir / scenario_id / f"{step_id}.png"

    def _asset_url(
        self,
        scenario_id: str,
        step_id: str,
        kind: Literal["scene", "hint", "thumbnail"],
    ) -> str:
        if kind == "thumbnail":
            return f"/static/images/{scenario_id}/thumb.png"
        if kind == "hint":
            return f"/static/images/{scenario_id}/{step_id}-hint.png"
        return f"/static/images/{scenario_id}/{step_id}.png"

    async def generate(
        self,
        scenario_id: str,
        step_id: str,
        prompt: str,
        kind: Literal["scene", "hint", "thumbnail"] = "scene",
        force: bool = False,
    ) -> ImageGenerateResponse:
        settings = get_settings()
        images_dir = settings.images_dir

        path = self._asset_path(images_dir, scenario_id, step_id, kind)
        url = self._asset_url(scenario_id, step_id, kind)

        # Cache hit — return immediately
        if path.exists() and not force:
            return ImageGenerateResponse(url=url, cached=True)

        # Ensure directory exists
        path.parent.mkdir(parents=True, exist_ok=True)

        use_placeholder = settings.mock_ai or not settings.gemini_api_key

        if use_placeholder:
            label = step_id if kind != "thumbnail" else "thumb"
            png_bytes = _make_placeholder_png(scenario_id, label)
        else:
            full_prompt = f"{prompt}\nStyle: {settings.image_style_preset}"
            loop = asyncio.get_event_loop()
            png_bytes = await loop.run_in_executor(None, _call_gemini_sync, prompt, full_prompt)
            if png_bytes is None:
                # Fallback to placeholder on Gemini failure
                label = step_id if kind != "thumbnail" else "thumb"
                png_bytes = _make_placeholder_png(scenario_id, label)

        path.write_bytes(png_bytes)
        return ImageGenerateResponse(url=url, cached=False)
