from dataclasses import asdict, fields

from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from signal_app.domain import entities as entity
from signal_app.domain.exceptions import Conflict

from . import models

MAPPING = {
    entity.User: models.UserModel,
    entity.Project: models.ProjectModel,
    entity.Issue: models.IssueModel,
    entity.RiskAssessment: models.RiskModel,
    entity.MitigationAction: models.ActionModel,
    entity.Comment: models.CommentModel,
    entity.AuditEvent: models.AuditModel,
}


class SqlRepository:
    def __init__(self, session):
        self.session = session

    @staticmethod
    def domain(kind, model):
        return kind(**{f.name: getattr(model, f.name) for f in fields(kind)}) if model else None

    def get(self, kind, identifier, *, lock=False):
        model = MAPPING[kind]
        statement = select(model).where(model.id == identifier).execution_options(populate_existing=True)
        if lock:
            statement = statement.with_for_update()
        return self.domain(kind, self.session.scalar(statement))

    def list(self, kind, **filters):
        statement = select(MAPPING[kind]).filter_by(**filters)
        return [self.domain(kind, m) for m in self.session.scalars(statement)]

    def add(self, record):
        self.session.add(MAPPING[type(record)](**asdict(record)))
        self.session.flush()

    def save(self, record):
        model = self.session.get(MAPPING[type(record)], record.id)
        for name, value in asdict(record).items():
            setattr(model, name, value)
        self.session.flush()


class SqlUnitOfWork:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    def __enter__(self):
        self.session = self.session_factory()
        self.repo = SqlRepository(self.session)
        return self

    def __exit__(self, exc_type, exc, tb):
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        except IntegrityError as error:
            self.session.rollback()
            raise Conflict("The change conflicts with existing data. Refresh and try again.") from error
        finally:
            self.session.close()


def make_uow(database_url):
    engine = create_engine(database_url, pool_pre_ping=True)
    factory = sessionmaker(engine, expire_on_commit=False)
    return engine, lambda: SqlUnitOfWork(factory)
