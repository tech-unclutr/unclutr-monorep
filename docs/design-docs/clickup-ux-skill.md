---
name: clickup-ux
description: Use when building new pages, features, or flows for SquareUp that need ClickUp-caliber UX — structured navigation, progressive disclosure, outcome-first copy, trust signals, and polished state handling.
---

# ClickUp UX Patterns for SquareUp

You are applying the UX architecture patterns that make ClickUp's product experience exceptional — adapted for SquareUp's premium, data-serious positioning.

This is NOT about copying ClickUp's visual style.
This is about adopting their **structural UX decisions** — the patterns that make a feature-dense product feel manageable, trustworthy, and immediately valuable.

---

# Core UX Principles

## 1. Narrative Architecture

Every page, section, and flow follows this sequence:

**Problem → Solution → Proof → Action**

- Open with the user's pain point (not the feature name)
- Show how this solves it
- Provide evidence it works (metrics, previews, social proof)
- End with a clear, low-friction call to action

Never lead with a feature name. Lead with an outcome.

```
❌ "Screening Criteria"
✅ "Ensure every participant matches your research needs"

❌ "Create a new study"
✅ "Launch your study in minutes"

❌ "Dashboard overview"
✅ "Your business at a glance"
```

## 2. Progressive Disclosure

Complexity exists. The user should never see all of it at once.

**Rules:**
- Show the core flow first. Advanced options reveal on demand.
- Use tabs to segment dense feature sets into digestible categories (max 6-8 per tab group)
- Each tab reveals its own content — never stack all categories on a single scroll
- "Learn more" and expandable sections handle depth without overwhelming breadth
- Wizard-style flows break multi-step processes into focused stages

**When to apply:**
- Any page with more than 5 distinct content sections
- Any form with more than 8 fields
- Any feature with beginner and advanced modes
- Navigation with more than 10 items at one level

## 3. Time-to-Value Obsession

The user must understand the value within **10 seconds** of seeing a screen.

**Rules:**
- The most important information visually dominates (largest, highest contrast, top-left quadrant)
- First-time visitors see a guided entry point, not a blank canvas
- Quantify value where possible: "Design studies 10x faster" > "AI-powered study design"
- Pre-fill intelligent defaults so the user sees a working example before customizing

## 4. Trust at Every Decision Point

Trust signals must appear wherever a user makes a commitment — not on a single security page.

**Where trust signals belong:**
- Signup and onboarding flows
- Data connection / integration configuration screens
- Participant data handling areas
- Payment and upgrade surfaces
- Any screen where the user shares credentials or personal data

**Trust signal types:**
- Security badges (SOC 2, GDPR, encryption indicators)
- Privacy micro-copy ("Your data is encrypted and never shared")
- Data handling transparency ("We only access what you authorize")
- Subtle, repeated — not a single full-page security section

---

# Interaction Patterns

## Pattern 1: Category Tabs for Dense Content

**When:** A page has 8+ items that span multiple categories.

**How:**
- Horizontal tab bar at the top of the content area
- Each tab label is immediately understandable (no jargon)
- Only one category visible at a time
- Tab content uses a consistent card grid
- Cards follow identical sizing and layout rhythm

**SquareUp applications:**
- Integration marketplace (E-commerce, Marketing, Analytics, Communication)
- Study templates (Usability, Discovery, Validation, Survey)
- Study phases in designer (Design → Recruit → Execute → Analyze)

## Pattern 2: Problem-Solution Section Framing

**When:** Introducing a feature, section, or empty state.

**How:**
- Open with a relatable pain statement (1 line)
- Follow with the solution statement (1 line)
- Then show the feature/content

```
"Tracking participants across spreadsheets wastes hours."
"SquareUp manages recruitment, screening, and scheduling in one flow."
[Recruitment feature UI]
```

## Pattern 3: Dual CTA Strategy

**When:** Any screen where the user decides to engage.

**How:**
- Primary CTA: self-serve, immediate action ("Start designing", "Try it free")
- Secondary CTA: high-touch, consultative ("Talk to an expert", "Book a walkthrough")
- Primary is bold/filled, secondary is outline/ghost
- Both always visible together — never hide the secondary

## Pattern 4: Quantified Value Anchoring

**When:** Showing benefits, completion states, or ROI.

**How:**
- Use specific numbers, not vague claims
- Anchor against the alternative (manual effort)
- Place metrics near relevant features, not in a separate stats section

```
"This study design would have taken 3 hours manually. SquareUp generated it in 12 seconds."
"Recruited 24 qualified participants in 2 hours."
```

## Pattern 5: AI as Contextual Assistant

**When:** AI features appear in the product.

**How:**
- AI lives inside existing workflows — inline suggestions, auto-fill, smart defaults
- Never position AI as a separate tool the user must navigate to
- Frame AI as time reclamation: "Design studies 10x faster" (not "AI designs your studies")
- The human is the expert. The AI is the accelerant.

## Pattern 6: Signup / Commitment as Non-Event

**When:** Any conversion point — signup, trial, upgrade consideration.

**How:**
- "Free forever. No credit card." or equivalent zero-risk framing
- Repeat the low-commitment message near every CTA
- Remove friction language: no "Submit," no "Register" — use "Get started" or "Start free"

---

# State Design (Non-Negotiable)

Every feature, page, and component must handle all 5 states:

## Empty State
- Custom illustration or meaningful icon (never a blank screen)
- Headline: what belongs here
- Description: why it matters (value framing)
- Primary CTA: the logical first action
- Optional: secondary link to learn more

```
[Illustration]
"Design your first study"
"SquareUp helps you plan, recruit, and execute research in one place."
[Create Study button]
```

## Loading State
- Skeleton screens with shimmer animation (never bare spinners)
- Progressive loading: most important content appears first
- Micro-pulse/breathe effects for AI-processing states
- Placeholder shapes match actual content layout

## Active / Full State
- Clear hierarchy: primary data dominates, secondary data supports
- Actions are obvious and accessible
- Content density matches user expertise (dense for power users, guided for new users)

## Partial / In-Progress State
- Show what exists and what's missing
- Progress indicators (steps completed, percentage, checklist)
- Encourage next action: "2 of 5 integrations connected. Add more to unlock insights."
- Never leave the user wondering "is this done?"

## Error State
- Inline and contextual (next to the affected field, not a global banner)
- Friendly language with suggested fix: "Study title is required" → "Give your study a name so your team can find it easily"
- Recovery action always included ("Try again", "Contact support", "Use default")
- Never show raw error codes or technical messages

---

# Copy & Messaging Rules

## Headlines
- **Outcome-first.** Focus on what the user gets, not what the feature does.
- **Specific over vague.** Numbers, time saved, results achieved.
- **Short.** 6-10 words max for primary headlines.

## CTAs
- Use action verbs: "Start designing", "Launch study", "Connect now"
- Never: "Submit", "Register", "Click here"
- Pair with benefit when space allows: "Start free — no credit card needed"

## Microcopy
- Write like a helpful colleague, not a system prompt
- Explain what things are on first encounter
- Anticipate confusion and address it inline
- Labels should be self-explanatory without tooltips

## Empty State Copy
- Always combine what + why + action
- Never leave the user with just "No data" or "Nothing here yet"

---

# Layout Architecture

## Page Structure
- **Full-width hero/header** → **Contained content grid** (max ~1200px) → **Full-width social proof/break** → **Contained features**
- This alternating rhythm creates visual breathing room

## Content Density
- Card-based grids with consistent sizing for scannable rhythm
- 80-120px spacing between major sections
- `p-6` minimum for container edges (let content breathe)
- Strong whitespace between sections — density inside sections, air between them

## Hierarchy
- Size + weight + color all work together (never size alone)
- The eye should follow: headline → key metric → supporting detail → action
- One primary CTA per section (never compete for attention)

## Responsive
- Card grids reflow from 3-4 columns → 2 → 1
- Tabs may collapse to dropdown on mobile
- Hero sections scale down gracefully (reduce type size, maintain hierarchy)

---

# What to Avoid

- **Feature density arms race.** ClickUp's biggest weakness is complexity. SquareUp stays focused and deep, not broad and shallow. If a page has too many features, split it.
- **Mascot/character-heavy branding.** Playful illustrations work for ClickUp's brand but undermine SquareUp's premium, data-serious positioning. Stick to minimal, geometric illustrations.
- **Aggressive superlative copy.** "Only AI," "Unlimited," "Superhuman" — hollow for a precision research platform. Be confident but measured.
- **Information overload on landing pages.** ClickUp's homepage has 14+ sections. SquareUp should aim for 6-8 focused sections that tell a tighter story.
- **Separate AI pricing/positioning.** AI is built-in, not bolted on. Never frame AI as an add-on or separate tier.

---

# Application Checklist

Before shipping any feature or page, verify:

- [ ] Narrative follows Problem → Solution → Proof → Action
- [ ] Primary action is obvious within 3 seconds
- [ ] Progressive disclosure manages complexity (tabs, expandable sections, wizards)
- [ ] All 5 states handled (empty, loading, active, partial, error)
- [ ] Copy is outcome-first (not feature-first)
- [ ] Trust signals present at decision points
- [ ] Dual CTA available where conversion matters
- [ ] Empty states guide the user to first action
- [ ] Error messages are inline, friendly, and suggest recovery
- [ ] Metrics/value quantified where possible
- [ ] AI features are inline, not separate tools
- [ ] Layout uses alternating full-width/contained rhythm
- [ ] Visual hierarchy uses size + weight + color (not size alone)

---

# Final Test

Ask yourself:

> "Would a smart user feel impressed, oriented, and in control within 10 seconds of seeing this?"

If not — simplify, clarify, and elevate until they would.

SquareUp builds a precision instrument, not a Swiss Army knife. Adopt ClickUp's structural intelligence while maintaining our focused, premium positioning.
