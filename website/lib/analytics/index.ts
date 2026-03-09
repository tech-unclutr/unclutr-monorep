// Public barrel export for analytics module

export { trackEvent, setUserProperties, isTrackingEnabled, initAnalytics } from "./core";
export { EventName } from "./types";
export type {
  GtagEventParams,
  TrackEventOptions,
  ScrollDepthParams,
  SectionViewParams,
  SectionExitParams,
  NavClickParams,
  NavDropdownToggleParams,
  CTAClickParams,
  CarouselInteractParams,
  CarouselAutoplayParams,
  CarouselDwellParams,
  VideoStartParams,
  VideoProgressParams,
  VideoPauseParams,
  StudyFilterParams,
  StudyCardClickParams,
  RageClickParams,
  ExitIntentParams,
  EngagementScoreParams,
  WebVitalParams,
  ErrorParams,
} from "./types";
export { SECTION_MAP, CAROUSEL_IDS } from "./constants";
export type { SectionId } from "./constants";

// Hooks
export { useSectionVisibility } from "./hooks/useSectionVisibility";
export { useScrollDepth } from "./hooks/useScrollDepth";
export { useVideoTracking } from "./hooks/useVideoTracking";
export { useCarouselTracking } from "./hooks/useCarouselTracking";
export { useCTATracking } from "./hooks/useCTATracking";
export { useHoverTracking } from "./hooks/useHoverTracking";
export { useRageClick } from "./hooks/useRageClick";
export { useExitIntent } from "./hooks/useExitIntent";
export { useEngagementScore } from "./hooks/useEngagementScore";

// Trackers
export { initPerformanceTracking } from "./trackers/performance";
export { initErrorTracking } from "./trackers/errors";
export { initDeviceTracking } from "./trackers/device";
export { initScrollBehaviorTracking } from "./trackers/scroll-behavior";
export { initCalcomTracking } from "./trackers/calcom";
export { initSessionQuality } from "./trackers/session-quality";
