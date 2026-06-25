import { runQuery } from "./neo4j";

export type UsageLog = {
  teacher_id: string;
  skill_name: string;
  source?: "orchestrate" | "single" | "history" | string;
};

export async function trackUsage({ teacher_id, skill_name, source = "orchestrate" }: UsageLog): Promise<void> {
  if (!teacher_id || !skill_name) return;
  try {
    await runQuery(
      `MERGE (t:Teacher {id: $teacher_id})
       MERGE (t)-[u:USED]->(s:Skill {name: $skill_name})
         ON CREATE SET u.count = 1, u.first_used = timestamp(), u.last_used = timestamp(),
                       u.last_source = $source
         ON MATCH SET u.count = u.count + 1,
                      u.last_used = timestamp(),
                      u.last_source = $source`,
      { teacher_id, skill_name, source },
      "write",
    );
  } catch (err) {
    console.error("[trackUsage]", err);
  }
}
