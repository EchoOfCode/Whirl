// ────────────────────────────────────────────────────────────
// Pet Logic — Evolution formulas and stat calculations
// ────────────────────────────────────────────────────────────

export type FocusStatus = 'FOCUSED' | 'DISTRACTED' | 'ABSENT' | 'IDLE';

export type EvolutionStage = 'egg' | 'wisp' | 'orb' | 'construct' | 'sentinel';

export interface PetStats {
    health: number;
    aura: number;
    evolutionXP: number;
    stage: EvolutionStage;
    totalFocusSeconds: number;
    totalDistractedSeconds: number;
    lastTickTime: number;
    createdAt: number;
}

const STAGE_THRESHOLDS: Record<EvolutionStage, number> = {
    egg: 0,
    wisp: 10,
    orb: 100,
    construct: 500,
    sentinel: 2000,
};

const STAGE_ORDER: EvolutionStage[] = ['egg', 'wisp', 'orb', 'construct', 'sentinel'];

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

function resolveStage(xp: number, currentStage: EvolutionStage): EvolutionStage {
    const currentIdx = STAGE_ORDER.indexOf(currentStage);
    let bestIdx = currentIdx;
    for (let i = currentIdx + 1; i < STAGE_ORDER.length; i++) {
        if (xp >= STAGE_THRESHOLDS[STAGE_ORDER[i]]) {
            bestIdx = i;
        }
    }
    return STAGE_ORDER[bestIdx];
}

export function tickUpdate(stats: PetStats, focusStatus: FocusStatus): PetStats {
    const now = Date.now();
    let { health, aura, evolutionXP, stage, totalFocusSeconds, totalDistractedSeconds } = stats;

    switch (focusStatus) {
        case 'FOCUSED':
            aura = clamp(aura + 1.5, 0, 100);
            evolutionXP = Math.max(0, evolutionXP + 0.5);
            if (health < 100) health = clamp(health + 0.3, 0, 100);
            totalFocusSeconds += 1;
            break;
        case 'DISTRACTED':
            aura = clamp(aura - 3.0, 0, 100);
            evolutionXP = Math.max(0, evolutionXP - 0.1);
            totalDistractedSeconds += 1;
            break;
        case 'ABSENT':
            aura = clamp(aura - 5.0, 0, 100);
            totalDistractedSeconds += 1;
            break;
        case 'IDLE':
            break;
    }

    if (aura <= 0 && focusStatus !== 'IDLE') {
        health = clamp(health - 1.0, 0, 100);
    }

    stage = resolveStage(evolutionXP, stage);

    return {
        health, aura, evolutionXP, stage,
        totalFocusSeconds, totalDistractedSeconds,
        lastTickTime: now,
        createdAt: stats.createdAt,
    };
}

export function createNewPet(): PetStats {
    return {
        health: 30, aura: 0, evolutionXP: 0, stage: 'egg',
        totalFocusSeconds: 0, totalDistractedSeconds: 0,
        lastTickTime: Date.now(), createdAt: Date.now(),
    };
}

export function getStageProgress(stats: PetStats): number {
    const currentIdx = STAGE_ORDER.indexOf(stats.stage);
    if (currentIdx >= STAGE_ORDER.length - 1) return 1;
    const currentThreshold = STAGE_THRESHOLDS[stats.stage];
    const nextThreshold = STAGE_THRESHOLDS[STAGE_ORDER[currentIdx + 1]];
    return clamp((stats.evolutionXP - currentThreshold) / (nextThreshold - currentThreshold), 0, 1);
}

export function getStageLabel(stage: EvolutionStage): string {
    return { egg: 'Egg', wisp: 'Wisp', orb: 'Orb', construct: 'Construct', sentinel: 'Sentinel' }[stage];
}
