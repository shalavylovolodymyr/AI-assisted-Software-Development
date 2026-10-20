from collections.abc import Callable
from typing import Protocol, TypeVar
from uuid import UUID

T = TypeVar("T")


class Repository(Protocol):
    def get(self, kind: type[T], identifier: UUID, *, lock: bool = False) -> T | None: ...
    def list(self, kind: type[T], **filters) -> list[T]: ...
    def add(self, entity) -> None: ...
    def save(self, entity) -> None: ...


class UnitOfWork(Protocol):
    repo: Repository

    def __enter__(self) -> "UnitOfWork": ...
    def __exit__(self, exc_type, exc, tb) -> None: ...


UowFactory = Callable[[], UnitOfWork]
