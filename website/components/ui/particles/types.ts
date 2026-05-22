export interface NarrativeParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  color: string;
  targetColor: string;
  colorProgress: number;
  alpha: number;
  baseAlpha: number;
  phase: ParticlePhase;
  birthTime: number;
  sparklePhase: number;
  sparkleSpeed: number;
  isSpecial: boolean;
  isFromHero: boolean;
  // Dynamic properties for special effects
  streamIndex?: number;
  orbit?: {
    radius: number;
    angle: number;
    speed: number;
    center: { x: number; y: number };
  };
  // Integration properties
  targetId?: string;
  targetX?: number;
  targetY?: number;
  integrationFactor: number; // 0 (flow) to 1 (snapped)
  heartTarget?: { t: number; scale: number; }; // For heart final fold
}

export type ParticlePhase =
  | "HANDOFF"
  | "FLOW"
  | "INTEGRATING"
  | "DISINTEGRATING"
  | "COLLECTION";

export interface SectionBehavior {
  name: string;
  scrollStart: number;
  scrollEnd: number;
  velocityMultiplier: number;
  spreadFactor: number;
  clusterStrength: number;
  specialEffect: "none" | "cluster" | "orbit" | "spread" | "converge" | "parallel_streams" | "heart";
  integrationZone?: {
    start: number; // 0-1 progress in section
    end: number;   // 0-1 progress in section
  };
}

export interface ParticleTarget {
  id: string;
  x: number;
  y: number;
}

export interface SectionTargetsEvent {
  sectionName: string;
  targets: ParticleTarget[];
}

export interface HeroParticleExitEvent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}
