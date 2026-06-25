"""Neo4j driver singleton + skill example repository."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from neo4j import AsyncDriver, AsyncGraphDatabase

from app.config import settings
from app.models import SkillExample

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


# ── SkillExample CRUD ─────────────────────────────────────

async def save_example(example: SkillExample) -> SkillExample:
    """Store a teacher-generated document as a few-shot example."""
    driver = get_driver()
    now = datetime.now(timezone.utc).isoformat()
    example_id = example.example_id or _make_id()

    props: dict[str, Any] = {
        "example_id": example_id,
        "skill_name": example.skill_name,
        "teacher_id": example.teacher_id,
        "content": example.content,
        "quality_score": example.quality_score,
        "help_count": example.help_count,
        "params_json": _dump_json(example.params),
        "updated_at": now,
    }

    query = """
    MERGE (e:SkillExample {example_id: $example_id})
    ON CREATE SET e.created_at = $now
    SET e += $props
    WITH e
    MATCH (t:Teacher {teacher_id: $teacher_id})
    MERGE (t)-[:CREATED]->(e)
    RETURN e.created_at AS created_at, e.help_count AS help_count
    """
    async with driver.session() as session:
        result = await session.run(
            query,
            example_id=example_id,
            teacher_id=example.teacher_id,
            props=props,
            now=now,
        )
        records = await result.data()

    example.example_id = example_id
    if records:
        example.created_at = records[0]["created_at"]
        example.help_count = records[0]["help_count"]
    return example


async def get_examples(
    skill_name: str,
    teacher_id: str | None = None,
    params: dict[str, Any] | None = None,
    limit: int = 5,
) -> list[SkillExample]:
    """Retrieve few-shot examples for a skill, prioritizing teacher's own + similar params."""
    driver = get_driver()

    # Build a relevance score from teacher match + param similarity.
    # teacher_match = 3.0, school_level match = 1.0, grade match = 1.0, subject match = 1.0.
    # This ensures the teacher's own examples surface first, then same-school-level, etc.
    params = params or {}
    teacher = teacher_id or ""

    query = """
    MATCH (e:SkillExample {skill_name: $skill_name})
    WHERE e.quality_score >= 0.3
    WITH e,
      CASE WHEN e.teacher_id = $teacher THEN 3.0 ELSE 0.0 END AS teacher_score,
      CASE WHEN e.params_json CONTAINS $school_level THEN 1.0 ELSE 0.0 END AS level_score,
      CASE WHEN e.params_json CONTAINS $grade THEN 1.0 ELSE 0.0 END AS grade_score,
      CASE WHEN e.params_json CONTAINS $subject THEN 1.0 ELSE 0.0 END AS subject_score
    WITH e, (teacher_score + level_score + grade_score + subject_score) AS relevance
    RETURN e, relevance
    ORDER BY relevance DESC, e.help_count DESC, e.quality_score DESC
    LIMIT $limit
    """
    school_level = params.get("school_level", "")
    grade = params.get("grade", "")
    subject = params.get("subject", "")

    async with driver.session() as session:
        result = await session.run(
            query,
            skill_name=skill_name,
            teacher=teacher,
            school_level=school_level,
            grade=grade,
            subject=subject,
            limit=limit,
        )
        records = await result.data()

    examples: list[SkillExample] = []
    for r in records:
        props = dict(r["e"])
        examples.append(
            SkillExample(
                example_id=props.get("example_id"),
                skill_name=props.get("skill_name", skill_name),
                teacher_id=props.get("teacher_id", ""),
                params=_parse_json(props.get("params_json", "{}")),
                content=props.get("content", ""),
                quality_score=props.get("quality_score", 0.0),
                help_count=props.get("help_count", 0),
                created_at=props.get("created_at"),
            )
        )
    return examples


async def record_feedback(example_id: str, helpful: bool) -> dict[str, Any] | None:
    """Register feedback on a skill example. Returns updated counts or None if not found."""
    driver = get_driver()
    delta_score = 0.12 if helpful else -0.08
    delta_help = 1 if helpful else 0

    query = """
    MATCH (e:SkillExample {example_id: $example_id})
    SET e.help_count = coalesce(e.help_count, 0) + $delta_help,
        e.quality_score = coalesce(e.quality_score, 0.5) + $delta_score
    RETURN e.help_count AS help_count, e.quality_score AS quality_score
    """
    async with driver.session() as session:
        result = await session.run(
            query,
            example_id=example_id,
            delta_help=delta_help,
            delta_score=max(-0.49, delta_score),  # clamp so score never drops below ~0.01
        )
        records = await result.data()

    if not records:
        return None
    return {
        "example_id": example_id,
        "help_count": records[0]["help_count"],
        "quality_score": round(records[0]["quality_score"], 3),
    }


async def get_teacher_stats(teacher_id: str) -> dict[str, Any]:
    """Aggregate self-learning stats for a teacher across all skills."""
    driver = get_driver()

    query = """
    MATCH (e:SkillExample)
    WHERE e.teacher_id = $teacher_id OR exists((:Teacher {teacher_id: $teacher_id})-[:CREATED]->(e))
    RETURN
      e.skill_name AS skill_name,
      count(e) AS total_examples,
      sum(CASE WHEN e.teacher_id = $teacher_id THEN 1 ELSE 0 END) AS own_examples,
      avg(e.quality_score) AS avg_quality_score,
      sum(coalesce(e.help_count, 0)) AS total_help_count
    ORDER BY total_examples DESC
    """
    async with driver.session() as session:
        result = await session.run(query, teacher_id=teacher_id)
        records = await result.data()

    return {
        "teacher_id": teacher_id,
        "total_examples": sum(r["total_examples"] for r in records),
        "total_skills": len(records),
        "by_skill": [
            {
                "skill_name": r["skill_name"],
                "total_examples": r["total_examples"],
                "own_examples": r["own_examples"],
                "avg_quality_score": round(r["avg_quality_score"], 3) if r["avg_quality_score"] else 0.0,
                "total_help_count": r["total_help_count"],
            }
            for r in records
        ],
    }


def _make_id() -> str:
    import uuid
    return str(uuid.uuid4())


def _dump_json(obj: Any) -> str:
    import json
    return json.dumps(obj, ensure_ascii=False)


def _parse_json(raw: str) -> dict[str, Any]:
    import json
    try:
        val = json.loads(raw)
        return val if isinstance(val, dict) else {}
    except (json.JSONDecodeError, TypeError):
        return {}
