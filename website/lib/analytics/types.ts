// GA4 Event Taxonomy — all event names and parameter interfaces

export type GtagEventParams = Record<string, string | number | boolean>;

export interface TrackEventOptions {
  /** Bypass requestIdleCallback and send immediately (for errors, exit intent) */
  immediate?: boolean;
}

// ── Event Names ──────────────────────────────────────────────────────────────

export const EventName = {
  // Page-level
  SCROLL_DEPTH: "scroll_depth",
  PAGE_TIME_SPENT: "page_time_spent",

  // Section visibility
  SECTION_VIEW: "section_view",
  SECTION_EXIT: "section_exit",
  SECTION_SCROLL_DEPTH: "section_scroll_depth",

  // Navigation
  NAV_CLICK: "nav_click",
  NAV_DROPDOWN_TOGGLE: "nav_dropdown_toggle",
  NAV_SCROLL_TO_TOP: "nav_scroll_to_top",

  // CTA
  CTA_CLICK: "cta_click",

  // Carousel
  CAROUSEL_INTERACT: "carousel_interact",
  CAROUSEL_AUTOPLAY: "carousel_autoplay",
  CAROUSEL_DWELL: "carousel_dwell",

  // Video
  VIDEO_START: "video_start",
  VIDEO_PROGRESS: "video_progress",
  VIDEO_COMPLETE: "video_complete",
  VIDEO_PAUSE: "video_pause",

  // Study catalog
  STUDY_FILTER: "study_filter",
  STUDY_CARD_CLICK: "study_card_click",
  STUDY_MODAL_OPEN: "study_modal_open",
  STUDY_MODAL_CLOSE: "study_modal_close",

  // Booking funnel
  BOOKING_SECTION_VIEW: "booking_section_view",
  BOOKING_CALENDAR_LOAD: "booking_calendar_load",
  BOOKING_DATE_SELECT: "booking_date_select",
  BOOKING_SLOT_SELECT: "booking_slot_select",
  BOOKING_COMPLETE: "booking_complete",

  // Scroll behavior
  SCROLL_VELOCITY_SPIKE: "scroll_velocity_spike",
  SCROLL_DIRECTION_CHANGE: "scroll_direction_change",
  SCROLL_RAGE: "scroll_rage",

  // Mouse / cursor
  HOVER_DWELL: "hover_dwell",
  CURSOR_IDLE: "cursor_idle",

  // Rage click
  RAGE_CLICK: "rage_click",

  // Exit intent
  EXIT_INTENT: "exit_intent",

  // Device / viewport
  VIEWPORT_INFO: "viewport_info",
  ORIENTATION_CHANGE: "orientation_change",

  // Performance (Web Vitals)
  WEB_VITAL_LCP: "web_vital_lcp",
  WEB_VITAL_FID: "web_vital_fid",
  WEB_VITAL_CLS: "web_vital_cls",
  WEB_VITAL_INP: "web_vital_inp",
  WEB_VITAL_TTFB: "web_vital_ttfb",

  // Errors
  JS_ERROR: "js_error",
  UNHANDLED_REJECTION: "unhandled_rejection",
  RESOURCE_LOAD_ERROR: "resource_load_error",

  // Engagement
  ENGAGEMENT_SCORE: "engagement_score",

  // Hero-specific
  HERO_TEXT_SWITCH: "hero_text_switch",
} as const;

export type EventNameValue = (typeof EventName)[keyof typeof EventName];

// ── Parameter Interfaces ─────────────────────────────────────────────────────

export interface ScrollDepthParams {
  depth_percent: number;
  depth_pixels: number;
}

export interface SectionViewParams {
  section_id: string;
  section_index: number;
}

export interface SectionExitParams {
  section_id: string;
  dwell_seconds: number;
  scroll_direction: "down" | "up";
}

export interface NavClickParams {
  nav_item: string;
  nav_type: "home" | "solution" | "cta";
  target_section: string;
}

export interface NavDropdownToggleParams {
  state: "open" | "close";
  method: "click" | "hover" | "keyboard";
}

export interface CTAClickParams {
  cta_text: string;
  cta_href: string;
  source_section: string;
  cta_position?: string;
}

export interface CarouselInteractParams {
  carousel_id: string;
  action: "next" | "prev" | "select";
  method: "click" | "swipe" | "keyboard" | "autoplay" | "dot";
  from_index: number;
  to_index: number;
  item_name: string;
}

export interface CarouselAutoplayParams {
  carousel_id: string;
  state: "start" | "pause" | "resume";
  pause_reason?: "hover" | "click" | "offscreen";
}

export interface CarouselDwellParams {
  carousel_id: string;
  item_index: number;
  item_name: string;
  dwell_seconds: number;
}

export interface VideoStartParams {
  video_name: string;
  source_carousel: string;
  card_index: number;
}

export interface VideoProgressParams {
  video_name: string;
  percent: 25 | 50 | 75 | 100;
}

export interface VideoPauseParams {
  video_name: string;
  pause_percent: number;
  pause_reason: "user" | "offscreen" | "card_change";
}

export interface StudyFilterParams {
  filter_role: string;
  results_count: number;
}

export interface StudyCardClickParams {
  study_name: string;
  study_category: string;
  card_index: number;
  filter_active: string;
}

export interface RageClickParams {
  element_tag: string;
  element_text: string;
  section_id: string;
  click_count: number;
}

export interface ExitIntentParams {
  method: "mouse_leave" | "back_button";
  section_id: string;
  scroll_depth_percent: number;
  time_on_page_seconds: number;
}

export interface EngagementScoreParams {
  score: number;
  sections_viewed: number;
  interactions: number;
  time_seconds: number;
  max_scroll_depth: number;
}

export interface WebVitalParams {
  value_ms: number;
  rating: "good" | "needs_improvement" | "poor";
}

export interface ErrorParams {
  error_message: string;
  error_source: string;
  error_line?: number;
  error_col?: number;
}
