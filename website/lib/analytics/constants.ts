// Section IDs, thresholds, and configuration

export const SECTION_MAP = {
  hero: 0,
  problem: 1,
  social_proof: 2,
  interview_studio: 3,
  agents: 4,
  studies: 5,
  cta_text: 6,
  trust_security: 7,
  book_call: 8,
  cta: 9,
  footer: 10,
} as const;

export type SectionId = keyof typeof SECTION_MAP;

export const SCROLL_DEPTH_MILESTONES = [10, 25, 50, 75, 90, 100] as const;
export const SECTION_SCROLL_MILESTONES = [25, 50, 75, 100] as const;

export const CAROUSEL_IDS = {
  PROBLEM_ARC: "problem_arc",
  PROBLEM_AVATAR: "problem_avatar",
  INTERVIEW_STUDIO: "interview_studio",
  AGENTS: "agents",
} as const;

// Performance thresholds
export const SCROLL_VELOCITY_THRESHOLD = 3000; // px/s
export const SCROLL_DIRECTION_CHANGE_THRESHOLD = 3; // changes in window
export const SCROLL_DIRECTION_CHANGE_WINDOW = 2000; // ms

export const HOVER_DWELL_THRESHOLD = 2000; // ms
export const RAGE_CLICK_THRESHOLD = 3; // clicks
export const RAGE_CLICK_WINDOW = 500; // ms

export const IDLE_THRESHOLD = 30000; // ms

export const EXIT_INTENT_COOLDOWN = 10000; // ms

// Engagement score weights
export const ENGAGEMENT_WEIGHTS = {
  SECTION_VIEW: 5,
  CAROUSEL_INTERACT: 3,
  VIDEO_START: 8,
  VIDEO_COMPLETE: 15,
  STUDY_MODAL: 5,
  CTA_CLICK: 20,
  BOOKING_REACHED: 10,
  TIME_PER_15S: 1,
  TIME_MAX: 20,
  SCROLL_PER_10: 1,
  SCROLL_MAX: 10,
} as const;

// GA4 limits
export const GA4_LIMITS = {
  EVENT_NAME_MAX_LENGTH: 40,
  PARAM_NAME_MAX_LENGTH: 40,
  PARAM_VALUE_MAX_LENGTH: 100,
  MAX_PARAMS_PER_EVENT: 25,
} as const;
