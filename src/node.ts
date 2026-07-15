/**
 * Yalnızca Node.js ortamı için isteğe bağlı entry point (`task-analysis-assessment-engine/node`).
 * `node:fs` kullanır — tarayıcı/edge bundle'larını etkilememesi için ana `index.ts`'ten
 * ayrı tutulur.
 */
import { readFileSync } from "node:fs";
import type { Skill, SkillDefinitionRepository } from "./domain/index.js";

export class JSONFileSkillDefinitionRepository implements SkillDefinitionRepository {
  constructor(private readonly filePath: string) {}

  loadSkills(): Skill[] {
    const raw = readFileSync(this.filePath, "utf-8");
    return JSON.parse(raw) as Skill[];
  }
}
