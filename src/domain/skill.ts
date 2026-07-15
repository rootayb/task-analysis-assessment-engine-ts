import type { SkillID, StepID } from "./ids.js";
import type { Domain } from "./domain.js";

/** Bir beceriyi oluşturan tek bir basamak. Kod içine hiçbir basamak gömülmez. */
export interface Step {
  readonly id: StepID;
  readonly skillId: SkillID;
  readonly order: number;
  readonly name: string;
  readonly description: string;
  readonly isRequired: boolean;
  readonly isCritical: boolean;
  readonly maxScore: number;
  readonly promptsAllowed: boolean;
  readonly repetitionCount: number;
}

export function createStep(input: {
  id: StepID;
  skillId: SkillID;
  order: number;
  name: string;
  description: string;
  isRequired?: boolean;
  isCritical?: boolean;
  maxScore?: number;
  promptsAllowed?: boolean;
  repetitionCount?: number;
}): Step {
  return {
    isRequired: true,
    isCritical: false,
    maxScore: 100,
    promptsAllowed: true,
    repetitionCount: 1,
    ...input
  };
}

/** Birden fazla basamaktan oluşan bir beceri (örn. "El Yıkama"). */
export interface Skill {
  readonly id: SkillID;
  readonly name: string;
  readonly domain: Domain;
  readonly steps: readonly Step[];
}

export function createSkill(input: { id: SkillID; name: string; domain: Domain; steps: readonly Step[] }): Skill {
  return { ...input, steps: [...input.steps].sort((a, b) => a.order - b.order) };
}

export function findStep(skill: Skill, id: StepID): Step | undefined {
  return skill.steps.find((s) => s.id === id);
}
