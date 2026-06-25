"""Neo4j driver singleton + persona repository.

Phase 1: simple property-graph storage — Teacher nodes with persona facts.
Phase 2 will swap the queries for Graphiti temporal edges.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from neo4j import AsyncGraphDatabase, AsyncDriver

from app.config import settings
from app.models import TeacherPersona

_driver: AsyncDriver | None = None


def get_driver() -> AsyncDriver:
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
    return _driver


async def close_driver() -> None:
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None


async def upsert_persona(persona: TeacherPersona) -> TeacherPersona:
    driver = get_driver()
    now = datetime.now(timezone.utc).isoformat()

    props: dict[str, Any] = {
        "teacher_id": persona.teacher_id,
        "name": persona.name,
        "school_level": persona.school_level,
        "subject": persona.subject,
        "school": persona.school,
        "teaching_style": persona.teaching_style,
        "philosophy": persona.philosophy,
        "group_id": settings.graphiti_group_id,
        "updated_at": now,
    }
    if persona.current_class:
        props["current_grade"] = persona.current_class.grade
        props["current_class_name"] = persona.current_class.class_name
        props["current_student_count"] = persona.current_class.student_count

    # MERGE on teacher_id: create if new (with created_at), otherwise update only.
    query = """
    MERGE (t:Teacher {teacher_id: $teacher_id})
    ON CREATE SET t.created_at = $now
    SET t += $props
    RETURN t.created_at AS created_at, t.updated_at AS updated_at
    """
    async with driver.session() as session:
        result = await session.run(query, teacher_id=persona.teacher_id, props=props, now=now)
        records = await result.data()

    if records:
        persona.created_at = records[0]["created_at"]
        persona.updated_at = records[0]["updated_at"]
    return persona


async def get_persona(teacher_id: str) -> TeacherPersona | None:
    driver = get_driver()
    query = """
    MATCH (t:Teacher {teacher_id: $teacher_id})
    RETURN t
    LIMIT 1
    """
    async with driver.session() as session:
        result = await session.run(query, teacher_id=teacher_id)
        records = await result.data()
    if not records:
        return None
    props = dict(records[0]["t"])

    current_class = None
    if props.get("current_grade") and props.get("current_class_name"):
        current_class = {
            "grade": props["current_grade"],
            "className": props["current_class_name"],
            "studentCount": props.get("current_student_count", 0),
        }

    return TeacherPersona(
        teacher_id=props["teacher_id"],
        name=props["name"],
        school_level=props["school_level"],
        subject=props["subject"],
        school=props.get("school"),
        teaching_style=props["teaching_style"],
        philosophy=props.get("philosophy"),
        current_class=current_class,
        created_at=props.get("created_at"),
        updated_at=props.get("updated_at"),
    )


async def search_related_facts(teacher_id: str, query: str, limit: int = 5) -> dict[str, list[str]]:
    driver = get_driver()
    cypher = """
    MATCH (t:Teacher {teacher_id: $teacher_id})
    WHERE any(k in ['name','subject','teaching_style','philosophy']
              WHERE toLower(t[k]) CONTAINS toLower($query))
    RETURN t.name AS fact, 'teacher-profile' AS source
    LIMIT $limit
    """
    async with driver.session() as session:
        result = await session.run(
            cypher, {"teacher_id": teacher_id, "query": query, "limit": limit}
        )
        records = await result.data()

    facts = [r["fact"] for r in records if r["fact"]]
    sources = sorted({r["source"] for r in records if r["source"]})
    return {"facts": facts, "sources": sources}
