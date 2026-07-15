import type { AssessmentSession, AssessmentSessionRepository, Skill, SkillDefinitionRepository, SkillID, StudentID } from "../domain/index.js";

export class InMemorySkillDefinitionRepository implements SkillDefinitionRepository {
  constructor(private readonly skills: readonly Skill[]) {}

  loadSkills(): Skill[] {
    return [...this.skills];
  }
}

export class InMemoryAssessmentSessionRepository implements AssessmentSessionRepository {
  private readonly sessionsByKey = new Map<string, AssessmentSession[]>();

  private key(skillId: SkillID, studentId: StudentID): string {
    return `${skillId}::${studentId}`;
  }

  loadSessions(skillId: SkillID, studentId: StudentID): AssessmentSession[] {
    return [...(this.sessionsByKey.get(this.key(skillId, studentId)) ?? [])];
  }

  save(session: AssessmentSession): void {
    const key = this.key(session.skillId, session.studentId);
    const list = this.sessionsByKey.get(key) ?? [];
    list.push(session);
    this.sessionsByKey.set(key, list);
  }
}
