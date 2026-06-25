"""ssamAI root pytest configuration.

Provides shared fixtures for all Python services.
Run from repo root: pytest
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent
SERVICES_DIR = REPO_ROOT / "services"


@pytest.fixture(scope="session")
def repo_root() -> Path:
    return REPO_ROOT


@pytest.fixture(scope="session")
def neo4j_test_uri() -> str:
    return os.environ.get("NEO4J_TEST_URI", "bolt://localhost:7687")


@pytest.fixture
def mock_neo4j_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NEO4J_URI", "bolt://localhost:7687")
    monkeypatch.setenv("NEO4J_USER", "neo4j")
    monkeypatch.setenv("NEO4J_PASSWORD", "test-password")


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    """Auto-mark async tests with asyncio."""
    for item in items:
        if "asyncio" in item.keywords:
            continue
        if hasattr(item, "obj") and getattr(item.obj, "__code__", None):
            if item.obj.__code__.co_flags & 0x100:  # CO_COROUTINE
                item.add_marker(pytest.mark.asyncio)
