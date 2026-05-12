"""Marker base for services.

Services hold business logic and depend on repositories (and other services).
They never touch the DB session directly — keep transactional control in the
session dependency / unit-of-work boundary at the router edge.
"""


class BaseService:
    pass
