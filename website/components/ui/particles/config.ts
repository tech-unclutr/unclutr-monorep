import { SectionBehavior } from "./types";

// Color palettes
export const DARK_COLORS = {
  primary: ["#ffffff", "#e8e8e8"],
  accent: ["#ff6b00", "#ff9f43", "#ffbe76"],
};

export const LIGHT_COLORS = {
  primary: ["#D4582A", "#E86830", "#C47A55", "#B33E33"], // Added terracotta
  accent: ["#FF5A36", "#E63946", "#FF6B35", "#F77F00", "#D90429"], // Added Cherry
  glow: ["#FF9F1C", "#E85D04", "#EF233C"],
};

// Get all light colors as flat array
export const LIGHT_COLOR_PALETTE = [
  ...LIGHT_COLORS.primary,
  ...LIGHT_COLORS.accent,
];

// Physics constants
export const PHYSICS = {
  baseVy: 0.3,
  baseVx: 0,
  drift: 0.02,
  sineWave: {
    amplitude: 0.15,
    frequency: 0.5,
  },
  maxVx: 0.6,
  minVy: 0.15,
  maxVy: 0.7,
};

// Particle settings
export const PARTICLE_SETTINGS = {
  maxParticles: 100,
  initialCount: 50,
  handoffSpawnRate: 0.15, // Probability of spawning from hero exit
  viewportBuffer: 100,
  edgeFade: 20,
};

// Size specifications
export const SIZES = {
  standard: { min: 1.0, max: 2.0 },
  accent: { min: 1.5, max: 2.5 },
  special: { min: 2.0, max: 3.0 },
};

// Opacity for light backgrounds
export const LIGHT_OPACITY = {
  base: 0.25, // Whisper-subtle on light backgrounds
  glowBlur: { min: 2, max: 6 }, // Minimal glow - background texture, not spotlights
};

// Section behaviors (scroll positions will be calculated dynamically)
export const SECTION_BEHAVIORS: Record<string, Omit<SectionBehavior, "scrollStart" | "scrollEnd">> = {
  problemSection: {
    name: "ProblemSection",
    velocityMultiplier: 1.4, // Entry burst feel
    spreadFactor: 2.5, // Spreading out
    clusterStrength: 0,
    specialEffect: "spread",
    integrationZone: { start: 0.2, end: 0.7 },
  },
  intelligenceLab: {
    name: "CustomerIntelligenceLab",
    velocityMultiplier: 0.8,
    spreadFactor: 0.6,
    clusterStrength: 0.5, // Stronger clustering to center
    specialEffect: "cluster",
    integrationZone: { start: 0.3, end: 0.8 },
  },
  coreFeatures: {
    name: "CoreFeatures",
    velocityMultiplier: 1.2,
    spreadFactor: 0.5,
    clusterStrength: 0,
    specialEffect: "parallel_streams", // Call/Synthesis/Action pipeline
    integrationZone: { start: 0.1, end: 0.9 },
  },
  agentsSection: {
    name: "AgentsSection",
    velocityMultiplier: 0.9,
    spreadFactor: 1.0,
    clusterStrength: 0.3,
    specialEffect: "orbit", // AI processing orbit
    integrationZone: { start: 0.2, end: 0.8 },
  },
  researchNeeds: {
    name: "ResearchNeeds",
    velocityMultiplier: 0.5, // Slowdown for insights crystallizing
    spreadFactor: 0.8,
    clusterStrength: 0.1,
    specialEffect: "none",
    integrationZone: { start: 0.4, end: 0.8 },
  },
  socialProof: {
    name: "SocialProof",
    velocityMultiplier: 0.9,
    spreadFactor: 1.2,
    clusterStrength: 0,
    specialEffect: "spread",
  },
  ctaSection: {
    name: "CTASection",
    velocityMultiplier: 0.2, // Slow down as it hands off to 3D canvas
    spreadFactor: 0.1,
    clusterStrength: 0.0,
    specialEffect: "none",
    integrationZone: { start: 0.0, end: 0.2 },
  },
  footer: {
    name: "Footer",
    velocityMultiplier: 0.4,
    spreadFactor: 0.3,
    clusterStrength: 0.6,
    specialEffect: "converge", // Spiral convergence
    integrationZone: { start: 0.5, end: 1.0 },
  },
};

// Footer collection effect
export const FOOTER_COLLECTION = {
  approachPhase: { start: 0, end: 0.4 },
  spiralPhase: { start: 0.4, end: 0.7 },
  collectPhase: { start: 0.7, end: 1.0 },
  convergenceStrength: 0.25, // Stronger convergence
  spiralSpeed: 0.04, // Faster spiral
};
