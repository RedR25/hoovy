"""Domain-level exceptions, decoupled from HTTP.

Routers translate these to HTTPException; services raise them.
"""


class DomainError(Exception):
    """Base for all domain errors."""


class NotFoundError(DomainError):
    """Entity not found."""


class ConflictError(DomainError):
    """State conflict (duplicate, version mismatch, etc.)."""


class UnauthorizedError(DomainError):
    """Authentication required or invalid."""


class ForbiddenError(DomainError):
    """Authenticated but not permitted."""


class ValidationError(DomainError):
    """Business rule violated."""
