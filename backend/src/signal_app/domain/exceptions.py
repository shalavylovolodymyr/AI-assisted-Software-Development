class DomainError(Exception):
    status_code = 409
    code = "business_rule"


class RuleViolation(DomainError):
    pass


class Conflict(DomainError):
    code = "conflict"


class NotFound(DomainError):
    status_code = 404
    code = "not_found"


class Forbidden(DomainError):
    status_code = 403
    code = "forbidden"
