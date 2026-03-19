export interface NavSection {
  id: string;
  label: string;
}

// All keyboard-navigable sections in DOM order.
// Used by useKeyboardNav for PageUp/PageDown/section-jump logic.
// SocialProof, FeaturesMarquee, TrustSecurity have no stable id — intentionally excluded.
export const NAVIGABLE_SECTIONS: NavSection[] = [
  { id: "hero",             label: "Hero"             },
  { id: "problem",          label: "Why SquareUp"     },
  { id: "interview-studio", label: "Interview Studio"  },
  { id: "studies",          label: "Studies"           },
  { id: "book-call",        label: "Book a Call"       },
  { id: "cta-section",      label: "Get Started"       },
];
