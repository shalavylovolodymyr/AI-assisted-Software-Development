"""Validate lifecycle artifacts and enforce inward Python dependency boundaries."""

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
required = [
    "AGENTS.md",
    "README.md",
    "docs/PROJECT.md",
    "docs/TASKS.md",
    "docs/ARCHITECTURE.md",
    "docs/TDD.md",
    "docs/AI_USAGE.md",
    "docs/DEMO.md",
    "docs/VALIDATION.md",
]
required += [f"docs/specs/UC-00{i}.md" for i in range(1, 5)]
required += [f"docs/adr/ADR-00{i}.md" for i in range(1, 4)]
for name in required:
    path = ROOT / name
    assert path.is_file() and path.stat().st_size > 50, (
        f"Missing or empty artifact: {name}"
    )
for layer in ("domain", "application"):
    for path in (ROOT / "backend/src/signal_app" / layer).rglob("*.py"):
        for node in ast.walk(ast.parse(path.read_text())):
            imports = (
                [a.name for a in node.names]
                if isinstance(node, ast.Import)
                else [node.module or ""]
                if isinstance(node, ast.ImportFrom)
                else []
            )
            for name in imports:
                assert not name.startswith(
                    (
                        "fastapi",
                        "sqlalchemy",
                        "pydantic",
                        "signal_app.infrastructure",
                        "signal_app.interfaces",
                    )
                ), f"Boundary violation: {path}: {name}"
                if layer == "domain":
                    assert not name.startswith("signal_app.application"), (
                        f"Domain imports application: {path}"
                    )
print("AI-SDLC artifacts and domain/application import boundaries verified.")
