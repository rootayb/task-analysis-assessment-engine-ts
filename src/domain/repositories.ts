import type { Skill } from "./skill.js";
import type { AssessmentSession } from "./observation.js";
import type { SkillID, StudentID } from "./ids.js";

export interface SkillDefinitionRepository {
  loadSkills(): Promise<Skill[]> | Skill[];
}

export interface AssessmentSessionRepository {
  loadSessions(skillId: SkillID, studentId: StudentID): Promise<AssessmentSession[]> | AssessmentSession[];
  save(session: AssessmentSession): Promise<void> | void;
}
