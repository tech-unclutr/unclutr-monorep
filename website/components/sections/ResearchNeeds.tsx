"use client";

import { useState, useRef, useMemo, useCallback, RefObject, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRegisterParticleTargets } from "@/components/ui/particles/useRegisterParticleTargets";
import { useSectionVisibility, trackEvent, EventName } from "@/lib/analytics";
import {
  ArrowRight,
  Sparkles,
  X,
  TrendingUp,
  Clock,
  Briefcase,
  Target,
  Zap,
  RefreshCcw,
  Video,
  MessageCircle,
  Mic,
  FileText,
  BarChart3,
  Users,
  CheckCircle2
} from "lucide-react";


// ─── Hex to RGBA helper ─────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─── Animated Metric Component ──────────────────────
function AnimatedMetric({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number>(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const match = value.match(/(\d+)/);
    if (!match) { setDisplay(value); return; }
    const num = parseInt(match[1], 10);
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(num * eased);
      setDisplay(value.replace(match[1], String(current)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <>{display}</>;
}

// ─── Types ──────────────────────────────────────────
type RoleId = "all" | "founder" | "npd" | "category" | "growth" | "cx" | "product" | "brand" | "revenue";

interface Study {
  id: string;
  name: string;
  outcome: string;
  roiMetric: string;
  timeToInsight: string;
  agencyTimeline: string;
  bestFor: string;
  worksFor: string;
  businessQuestion: string;
  touchpoints: string[];
  deliverables: string[];
  urgencySignal: string;
  whenToUse: string;
  owner: string;
  methodDetails: string;
  sampleInsight: string;
  color: string;
  bgGlow: string;
  roles: RoleId[];
}

// ─── Full Study Catalog ─────────────────────────────
const studiesList: Study[] = [
  // ── Founders & Strategy ───────────────────────────
  {
    id: "discovery",
    name: "Discovery & Problem Validation",
    outcome: "Avoid building the wrong thing",
    roiMetric: "Save $100K+ in wasted eng cycles",
    timeToInsight: "3–5 days",
    agencyTimeline: "4 weeks",
    bestFor: "Founders, Strategy Heads",
    worksFor: "Early-stage startups, teams entering a new vertical, pre-Series A founders",
    businessQuestion: "Is the problem we're solving actually painful enough for people to pay for a solution?",
    touchpoints: ["1:1 Video Calls", "WhatsApp Diaries", "In-depth Interviews"],
    deliverables: ["Pain-point severity map", "Jobs-to-be-Done framework", "Opportunity sizing"],
    urgencySignal: "You're about to commit engineering resources to a hypothesis nobody validated",
    whenToUse: "Before writing a single line of code or committing to a product direction",
    owner: "Founder / Head of Product",
    methodDetails: "Deep 1:1 video interviews with target users combined with WhatsApp diary studies to capture real pain points in context, synthesized into a Jobs-to-be-Done framework.",
    sampleInsight: "8 out of 12 participants described the same workaround — exporting data to Google Sheets because existing tools can't filter by region. Willingness to pay for a native solution: high.",
    color: "#4A90D9",
    bgGlow: "bg-blue-500/10",
    roles: ["all", "founder", "product"]
  },
  {
    id: "icp",
    name: "ICP & Buyer Persona Definition",
    outcome: "Laser-focus your GTM",
    roiMetric: "2× improvement in lead quality",
    timeToInsight: "1 week",
    agencyTimeline: "5 weeks",
    bestFor: "Founders, Growth, Sales Leads",
    worksFor: "B2B SaaS teams, D2C brands launching new segments, marketplaces expanding categories",
    businessQuestion: "Who is our highest-value buyer, and what language do they use to describe their problem?",
    touchpoints: ["Structured Interviews", "Quant Surveys"],
    deliverables: ["Persona cards", "Messaging hooks by segment", "Channel recommendations"],
    urgencySignal: "Your CAC is rising because you're targeting too broad an audience",
    whenToUse: "Before scaling paid acquisition or hiring a sales team",
    owner: "Head of Growth / Founder",
    methodDetails: "Structured buyer interviews cross-referenced with quantitative survey data to build statistically validated persona clusters with their exact language and decision triggers.",
    sampleInsight: "Your highest-LTV buyer is a 'Pragmatic Operator' (38% of sample) — they Google 'best [category] for small teams' and decide within 72 hours. They trust G2 reviews, not blogs.",
    color: "#8B5CF6",
    bgGlow: "bg-violet-500/10",
    roles: ["all", "founder", "growth", "brand"]
  },
  {
    id: "market-entry",
    name: "Market Entry & Category Creation",
    outcome: "Enter with conviction",
    roiMetric: "De-risk $500K+ launch spend",
    timeToInsight: "1 week",
    agencyTimeline: "6 weeks",
    bestFor: "Founders, Strategy, Category Leads",
    worksFor: "Brands entering adjacent categories, international expansion teams, category creators",
    businessQuestion: "Is there whitespace in this category, and can we win a meaningful share from Day 1?",
    touchpoints: ["Expert Interviews", "Consumer Surveys", "Competitive Shops"],
    deliverables: ["Category map", "Positioning matrix", "Go/No-Go recommendation"],
    urgencySignal: "You're about to commit serious launch budget without knowing if whitespace actually exists",
    whenToUse: "Before committing to a new market, geography, or category expansion",
    owner: "Strategy Lead / Founder",
    methodDetails: "Expert stakeholder interviews combined with consumer surveys and competitive landscape shopping to map category gaps, unmet needs, and realistic share-of-wallet potential.",
    sampleInsight: "The 'premium-but-accessible' tier is unoccupied. Competitors cluster at either <$15 mass-market or >$40 luxury. 64% of target consumers would pay $22–28 for a product delivering X.",
    color: "#10B981",
    bgGlow: "bg-emerald-500/10",
    roles: ["all", "founder", "category"]
  },

  // ── New Product Development ────────────────────────
  {
    id: "concept-test",
    name: "Concept Testing",
    outcome: "Kill duds before you build",
    roiMetric: "Save 3–6 months of dev time",
    timeToInsight: "72 hours",
    agencyTimeline: "4 weeks",
    bestFor: "NPD Leads, Product Managers",
    worksFor: "NPD teams with multiple concept directions, product managers prioritizing bets",
    businessQuestion: "Which of our concept directions has the highest appeal, uniqueness, and purchase intent?",
    touchpoints: ["Monadic/Sequential Surveys", "Concept Boards"],
    deliverables: ["Appeal vs Uniqueness quadrant", "Purchase intent scores", "Feature ranking"],
    urgencySignal: "You have 3+ concepts and can only resource one — picking wrong costs quarters",
    whenToUse: "When you have concepts ready but need data to pick the winner",
    owner: "NPD Lead / Product Manager",
    methodDetails: "Monadic and sequential exposure surveys with concept boards, measuring appeal, uniqueness, purchase intent, and perceived value across target segments.",
    sampleInsight: "Concept B ('Smart Refill') scored 4.3/5 on appeal and 4.1 on uniqueness — a rare combination. Concept A had higher appeal (4.5) but only 2.8 uniqueness, signaling 'me-too'.",
    color: "#9C6ADE",
    bgGlow: "bg-purple-500/10",
    roles: ["all", "npd", "product"]
  },
  {
    id: "taste-test",
    name: "Taste & Sensory Testing",
    outcome: "Win blind tests before launch",
    roiMetric: "2× higher trial-to-repeat rate",
    timeToInsight: "5–7 days",
    agencyTimeline: "4 weeks",
    bestFor: "NPD, R&D, QSR Menu Teams",
    worksFor: "CPG food & beverage teams, QSR brands, R&D labs iterating formulations",
    businessQuestion: "Does variant A or B win on taste, texture, aroma - and does it beat the market leader?",
    touchpoints: ["In-person CLTs", "Home-use Tests (HUT)"],
    deliverables: ["Sensory profiles", "Preference scores", "Reformulation brief"],
    urgencySignal: "You're about to scale production on a formula that hasn't been validated against competitors",
    whenToUse: "Before finalizing a recipe, reformulating, or launching a new SKU",
    owner: "R&D Lead / NPD Manager",
    methodDetails: "Central location tests (CLT) and home-use tests (HUT) with structured sensory profiling, blind preference testing, and attribute diagnostics against market benchmarks.",
    sampleInsight: "Variant B wins on overall liking (7.2 vs 6.4) and dominates on 'creaminess' (+31%). However, 'aftertaste' scores are below category average — a sweetness adjustment should fix it.",
    color: "#F59E0B",
    bgGlow: "bg-amber-500/10",
    roles: ["all", "npd"]
  },
  {
    id: "packaging",
    name: "Packaging & Shelf Impact Test",
    outcome: "Win the 3-second shelf decision",
    roiMetric: "+18% shelf pick-up rate",
    timeToInsight: "3–5 days",
    agencyTimeline: "3 weeks",
    bestFor: "NPD, Brand, Merchandising",
    worksFor: "Brand teams redesigning packaging, NPD teams launching new SKUs, merchandising leads",
    businessQuestion: "Does our new pack design grab attention, communicate value, and outperform the current one?",
    touchpoints: ["Eye-tracking Surveys", "Virtual Shelf Simulations"],
    deliverables: ["Shelf attention heatmaps", "Design winner report", "Recall & association scores"],
    urgencySignal: "You're about to print thousands of units of a design that hasn't been shelf-tested",
    whenToUse: "Before finalizing packaging artwork or committing to a design direction",
    owner: "Brand Manager / Design Lead",
    methodDetails: "Virtual shelf simulations with eye-tracking surveys measuring time-to-notice, design recall, value perception, and head-to-head pick-up preference vs. current design and key competitors.",
    sampleInsight: "Design B is spotted 1.8s faster than the current pack. Unaided recall after 5 seconds: 72% vs 41%. However, Design B underperforms on 'premium' perception — the matte variant fixes this.",
    color: "#EC4899",
    bgGlow: "bg-pink-500/10",
    roles: ["all", "npd", "brand", "category"]
  },
  {
    id: "menu-innovation",
    name: "Menu Concept & LTO Validation",
    outcome: "Launch only winners",
    roiMetric: "3× higher LTO conversion rate",
    timeToInsight: "48 hours",
    agencyTimeline: "3 weeks",
    bestFor: "QSR Menu Teams, NPD",
    worksFor: "QSR menu teams, fast-casual chains, cloud kitchen operators",
    businessQuestion: "Will this new menu item drive enough incremental orders to justify the kitchen complexity?",
    touchpoints: ["Digital Menu Board Test", "Rapid Surveys"],
    deliverables: ["Concept appeal ranking", "Price acceptance", "Cannibalization risk"],
    urgencySignal: "Your next LTO window is weeks away and you're choosing between concepts by gut feel",
    whenToUse: "Before committing kitchen ops and marketing spend to a limited-time offer",
    owner: "Menu Innovation Lead / Brand Manager",
    methodDetails: "Digital menu board exposure tests with rapid concept appeal surveys, measuring order intent, price acceptance, and cannibalization risk against existing top-sellers.",
    sampleInsight: "The 'Truffle Smash Burger' drives 38% incremental intent (not cannibalizing the Classic). Price ceiling is $14.99. The 'Korean BBQ Wrap' splits the base — 60% would substitute the existing wrap.",
    color: "#EF4444",
    bgGlow: "bg-red-500/10",
    roles: ["all", "npd"]
  },

  // ── Category & Merchandising ──────────────────────
  {
    id: "assortment",
    name: "Assortment Optimization",
    outcome: "Maximize per-SKU revenue",
    roiMetric: "+12% revenue per shelf foot",
    timeToInsight: "1 week",
    agencyTimeline: "5 weeks",
    bestFor: "Category Managers, Merchandising",
    worksFor: "Category managers, retail merchandisers, D2C brands with growing SKU counts",
    businessQuestion: "Which SKUs should we keep, cut, or add to maximise category sales without cannibalising ourselves?",
    touchpoints: ["MaxDiff Surveys", "Purchase Diaries"],
    deliverables: ["SKU importance ranking", "Optimal assortment map", "Cannibalization matrix"],
    urgencySignal: "Your shelf space is flat but SKU count keeps growing — you need to cut without losing sales",
    whenToUse: "Before range reviews, planogram resets, or when SKU proliferation is hurting margins",
    owner: "Category Manager / Head of Merchandising",
    methodDetails: "MaxDiff-based surveys combined with purchase diary analysis to statistically rank SKU importance, identify must-stocks, and model the revenue impact of assortment changes.",
    sampleInsight: "Bottom 6 SKUs contribute only 4% of category revenue but occupy 22% of shelf space. Cutting them and expanding top 3 by one facing each lifts revenue/foot by 14%.",
    color: "#6366F1",
    bgGlow: "bg-indigo-500/10",
    roles: ["all", "category"]
  },
  {
    id: "brand-switch",
    name: "Brand Switching & Loyalty Drivers",
    outcome: "Defend your market share",
    roiMetric: "Identify the #1 switch trigger",
    timeToInsight: "5 days",
    agencyTimeline: "4 weeks",
    bestFor: "Category Managers, Brand Leads",
    worksFor: "Brand managers seeing share erosion, category leads tracking competitive threats",
    businessQuestion: "Why are our repeat buyers trialling competitor brands, and what would bring them back?",
    touchpoints: ["Switcher Intercepts", "Loyalty Surveys"],
    deliverables: ["Switch driver hierarchy", "Win-back playbook", "Competitive positioning gaps"],
    urgencySignal: "Your repeat purchase rate is declining and you don't know if it's price, product, or a competitor",
    whenToUse: "When you see early signals of share loss or rising competitor trial",
    owner: "Brand Lead / Category Manager",
    methodDetails: "Switcher intercept interviews with loyalty survey quantification to build a hierarchical model of switch triggers, ranked by impact and addressability.",
    sampleInsight: "The #1 switch trigger isn't price (ranked 3rd). It's 'availability at my preferred store' (42% of switchers). Competitor X's DTC subscription removed the availability friction entirely.",
    color: "#F97316",
    bgGlow: "bg-orange-500/10",
    roles: ["all", "category", "brand"]
  },

  // ── Growth & Performance Marketing ────────────────
  {
    id: "checkout",
    name: "Checkout & Payment Flow Friction",
    outcome: "Direct revenue recovery",
    roiMetric: "+14% checkout conversion lift",
    timeToInsight: "48 hours",
    agencyTimeline: "3 weeks",
    bestFor: "Growth Leads, Ecom Managers",
    worksFor: "E-commerce growth teams, fintech checkout teams, subscription businesses",
    businessQuestion: "Why are high-intent users adding to cart but dropping off at the payment step?",
    touchpoints: ["Unmoderated Usability", "Abandoner Surveys"],
    deliverables: ["Friction severity scorecard", "Session video clips", "A/B test backlog"],
    urgencySignal: "Your add-to-cart rate is strong but checkout completion is below industry benchmark",
    whenToUse: "When cart-to-purchase conversion drops or after a checkout redesign",
    owner: "Growth PM / E-commerce Lead",
    methodDetails: "Unmoderated usability testing of the live checkout flow combined with abandoner micro-surveys, generating a friction severity scorecard with video evidence for each issue.",
    sampleInsight: "73% of drop-offs happen at the address step — not payment. Users on mobile can't auto-fill because form fields lack autocomplete attributes. Estimated recovery: 9% of abandoned carts.",
    color: "#E8A838",
    bgGlow: "bg-orange-500/10",
    roles: ["all", "growth", "product"]
  },
  {
    id: "ad-testing",
    name: "Ad & Creative Resonance Testing",
    outcome: "Maximize ROAS before scaling",
    roiMetric: "+25% CTR on winning variant",
    timeToInsight: "48 hours",
    agencyTimeline: "2 weeks",
    bestFor: "Performance Marketing, Brand",
    worksFor: "Performance marketing teams, brand teams pre-campaign, creative agencies validating work",
    businessQuestion: "Which creative concept will drive the highest attention, recall, and click intent in our target audience?",
    touchpoints: ["Rapid A/B Surveys", "Attention Heatmaps"],
    deliverables: ["Creative ranking", "Emotional response map", "Audience-message fit scores"],
    urgencySignal: "You're about to put significant media spend behind creative that hasn't been audience-tested",
    whenToUse: "Before scaling ad spend or choosing between creative directions",
    owner: "Performance Marketing Lead / Brand Manager",
    methodDetails: "Rapid A/B creative surveys with attention heatmaps measuring instant reactions, message recall, emotional response, and click/purchase intent across audience segments.",
    sampleInsight: "Creative C ('social proof UGC') outperforms the polished brand video on every metric: +31% recall, +25% CTR intent, +18% purchase consideration. The audience trusts real over polished.",
    color: "#14B8A6",
    bgGlow: "bg-teal-500/10",
    roles: ["all", "growth", "brand"]
  },
  {
    id: "path-to-purchase",
    name: "Path-to-Purchase Mapping",
    outcome: "Know every step before the buy",
    roiMetric: "Find the #1 conversion blocker",
    timeToInsight: "1 week",
    agencyTimeline: "4 weeks",
    bestFor: "Growth, Category Managers",
    worksFor: "Growth teams, category managers, omnichannel retail strategists",
    businessQuestion: "What does the real customer journey look like - from first awareness to clicking 'Buy'?",
    touchpoints: ["Journey Diaries", "Retrospective Interviews"],
    deliverables: ["Full journey map", "Touchpoint influence ranking", "Moment-of-truth analysis"],
    urgencySignal: "You're investing in channels without knowing which touchpoints actually drive conversion",
    whenToUse: "When planning media mix, channel strategy, or diagnosing funnel leakage",
    owner: "Growth Lead / Category Manager",
    methodDetails: "Customer journey diaries over 7–14 days combined with retrospective interviews to map every touchpoint from awareness to purchase, with influence attribution at each step.",
    sampleInsight: "The real decision moment isn't your website — it's WhatsApp groups. 58% of buyers shared a screenshot in a group chat before purchasing. The friend's reply was the final trigger.",
    color: "#0EA5E9",
    bgGlow: "bg-sky-500/10",
    roles: ["all", "growth", "category"]
  },
  {
    id: "cart-abandon",
    name: "Cart Abandonment Deep Dive",
    outcome: "Recover lost revenue",
    roiMetric: "Recover 8–15% of abandoned carts",
    timeToInsight: "3 days",
    agencyTimeline: "3 weeks",
    bestFor: "Ecom Leads, Growth PMs",
    worksFor: "E-commerce managers, D2C growth teams, marketplace operators",
    businessQuestion: "Is it price shock, shipping cost surprise, or trust anxiety that's killing carts at the last step?",
    touchpoints: ["Exit Intent Surveys", "Abandoner Callbacks"],
    deliverables: ["Abandonment driver tree", "Price sensitivity signals", "Trust element audit"],
    urgencySignal: "Your cart abandonment rate exceeds 70% and recovery emails aren't moving the needle",
    whenToUse: "When abandonment rates spike or recovery campaigns underperform",
    owner: "E-commerce Lead / Growth PM",
    methodDetails: "Exit-intent surveys triggered at abandonment combined with callback interviews with high-value abandoners to isolate root causes: price shock, shipping, trust, or friction.",
    sampleInsight: "It's not the price — 61% said the total was 'expected'. The killer is 'estimated delivery: 7–10 days'. Competitors offer 2-day. An express option recovers an estimated 12% of carts.",
    color: "#D946EF",
    bgGlow: "bg-fuchsia-500/10",
    roles: ["all", "growth"]
  },

  // ── Customer Experience ────────────────────────────
  {
    id: "csat",
    name: "CSAT & NPS Driver Tagging",
    outcome: "Fix the actual churn triggers",
    roiMetric: "+15 NPS points in 1 quarter",
    timeToInsight: "Continuous",
    agencyTimeline: "Quarterly batch",
    bestFor: "CX Heads, Product Leaders",
    worksFor: "CX teams, product leaders, ops teams responsible for service quality",
    businessQuestion: "What specific product or service moments are fuelling our 1-star vs 5-star reviews?",
    touchpoints: ["In-app Intercepts", "Post-interaction Surveys"],
    deliverables: ["Live driver dashboard", "Sentiment heatmaps", "Priority fix matrix"],
    urgencySignal: "Your NPS is trending down but open-text feedback is too noisy to action",
    whenToUse: "As an always-on program or when NPS/CSAT trends need diagnosis",
    owner: "CX Head / VP Product",
    methodDetails: "AI-powered tagging of in-app intercept and post-interaction survey responses, auto-classifying drivers into actionable categories with live dashboards and trend alerting.",
    sampleInsight: "Your #1 detractor driver shifted this month: 'app loading speed' overtook 'support wait time' (which improved). 83% of 1-star reviews mention load times over 4 seconds.",
    color: "#F43F5E",
    bgGlow: "bg-rose-500/10",
    roles: ["all", "cx"]
  },
  {
    id: "churn",
    name: "Churn & Cancellation Intercepts",
    outcome: "Stop revenue bleeding",
    roiMetric: "Reduce churn by 20%+",
    timeToInsight: "5 days",
    agencyTimeline: "4 weeks",
    bestFor: "CX, Retention, Founders",
    worksFor: "Subscription businesses, SaaS retention teams, founders watching MRR decline",
    businessQuestion: "Are users leaving because of price, product gaps, or a competitor - and can we save them at the exit?",
    touchpoints: ["Cancel-flow Interviews", "Win-back Surveys"],
    deliverables: ["Churn reason taxonomy", "Save-offer effectiveness", "Win-back playbook"],
    urgencySignal: "Monthly churn is above target and you're guessing whether it's product, price, or competition",
    whenToUse: "When churn rate exceeds target or before launching a retention initiative",
    owner: "Retention Lead / CX Head",
    methodDetails: "Cancel-flow intercept interviews with churned users, combined with win-back offer testing surveys, to build a reason taxonomy ranked by revenue impact and save-ability.",
    sampleInsight: "44% of churners cite 'I only needed it for one project' — not dissatisfaction. A 'pause subscription' option (78% acceptance) would retain an estimated $18K MRR.",
    color: "#EF4444",
    bgGlow: "bg-red-500/10",
    roles: ["all", "cx", "founder", "revenue"]
  },
  {
    id: "returns",
    name: "Returns & Refunds Deep Dive",
    outcome: "Slash logistics costs",
    roiMetric: "Cut return rate by 3–5%",
    timeToInsight: "5 days",
    agencyTimeline: "3 weeks",
    bestFor: "CX, Ops, Ecom Managers",
    worksFor: "E-commerce ops teams, D2C brands with high return rates, fashion/apparel companies",
    businessQuestion: "Are users returning because of sizing, quality mismatch, or expectation gaps from the product page?",
    touchpoints: ["Post-return Interviews", "Unboxing Flow Mapping"],
    deliverables: ["Root-cause return tree", "PDP fix recommendations", "Expectation gap analysis"],
    urgencySignal: "Return rate is eating into margins and you can't tell if it's sizing, quality, or expectations",
    whenToUse: "When return rates exceed category benchmarks or after a product launch with high returns",
    owner: "CX Lead / E-commerce Ops Manager",
    methodDetails: "Post-return interviews and product page vs. reality gap analysis, mapping the root-cause tree from expectation set online to experience at unboxing to isolate fixable causes.",
    sampleInsight: "68% of 'Fit Issue' returns aren't actually fit problems — they're fabric weight surprises. Adding a '150 GSM — lightweight' descriptor could cut returns by 22%.",
    color: "#FF5A36",
    bgGlow: "bg-[#FF5A36]/10",
    roles: ["all", "cx", "category"]
  },
  {
    id: "delivery-exp",
    name: "Delivery & Unboxing Experience",
    outcome: "Turn logistics into loyalty",
    roiMetric: "+22% repeat purchase intent",
    timeToInsight: "1 week",
    agencyTimeline: "3 weeks",
    bestFor: "CX, D2C Operations",
    worksFor: "D2C brands, premium e-commerce, subscription box companies",
    businessQuestion: "Does the delivery and unboxing experience match the brand promise we make before purchase?",
    touchpoints: ["Home-delivery Observation", "Post-delivery Surveys"],
    deliverables: ["Experience gap audit", "Packaging improvement brief", "Moment-of-delight map"],
    urgencySignal: "Your brand story ends at checkout — the unboxing experience doesn't match the promise",
    whenToUse: "Before a packaging refresh or when repeat purchase rates are below target",
    owner: "CX Lead / Brand Manager",
    methodDetails: "Home-delivery observation studies and post-delivery surveys capturing the full experience from tracking notification to unboxing, scoring each moment against brand expectations.",
    sampleInsight: "The 'wow' moment isn't the product — it's the handwritten note (NPS: 82 with it vs. 54 without). But 40% of packages arrive dented, erasing premium perception before it starts.",
    color: "#38BDF8",
    bgGlow: "bg-sky-500/10",
    roles: ["all", "cx"]
  },

  // ── Digital Product & UX ───────────────────────────
  {
    id: "usability",
    name: "Usability Testing",
    outcome: "Ship flows that actually work",
    roiMetric: "-40% task failure rate",
    timeToInsight: "48 hours",
    agencyTimeline: "3 weeks",
    bestFor: "Product Managers, UX Designers",
    worksFor: "Product teams pre-launch, UX designers validating prototypes, PMs de-risking sprints",
    businessQuestion: "Can our users complete the core task flow without confusion, frustration, or errors?",
    touchpoints: ["Moderated Sessions", "Unmoderated Recordings"],
    deliverables: ["Task success rates", "Friction heatmap", "Priority fix list with severities"],
    urgencySignal: "You're about to ship a major flow change without watching real users try it",
    whenToUse: "Before shipping new features, after redesigns, or when task completion rates drop",
    owner: "Product Manager / UX Lead",
    methodDetails: "Moderated and unmoderated task-based testing sessions with real users, measuring task success rates, time-on-task, error paths, and satisfaction, with video highlights per finding.",
    sampleInsight: "5 of 8 users couldn't find 'Export' — it's hidden behind a '...' menu they assumed was Settings. Moving it to the toolbar increased task success from 37% to 95%.",
    color: "#8B5CF6",
    bgGlow: "bg-violet-500/10",
    roles: ["all", "product"]
  },
  {
    id: "feature-priority",
    name: "Feature Prioritization (MaxDiff)",
    outcome: "Build only what matters most",
    roiMetric: "3× roadmap confidence",
    timeToInsight: "3 days",
    agencyTimeline: "3 weeks",
    bestFor: "Product Leads, Engineering Heads",
    worksFor: "Product leads with bloated backlogs, engineering heads allocating sprint capacity",
    businessQuestion: "Out of our 12 potential features, which 3 would drive the most adoption and willingness-to-pay?",
    touchpoints: ["MaxDiff Surveys", "Conjoint Analysis"],
    deliverables: ["Feature utility scores", "Adoption likelihood matrix", "Build vs. skip recommendation"],
    urgencySignal: "Your roadmap has 15 items and stakeholders can't agree which 3 to build first",
    whenToUse: "During quarterly planning, before roadmap commits, or when stakeholder opinions conflict",
    owner: "Head of Product / CPO",
    methodDetails: "MaxDiff (best-worst scaling) surveys and conjoint analysis with your user base to generate statistically rigorous utility scores, removing opinion bias from prioritization.",
    sampleInsight: "'Offline mode' has 3x the utility score of 'dark mode' despite leadership ranking them equally. Users who want offline mode also have 2.1x higher willingness-to-pay for premium.",
    color: "#6366F1",
    bgGlow: "bg-indigo-500/10",
    roles: ["all", "product"]
  },
  {
    id: "onboarding",
    name: "Onboarding & Activation Flow",
    outcome: "Fix Day-1 drop-offs",
    roiMetric: "+30% Day-7 activation rate",
    timeToInsight: "3–5 days",
    agencyTimeline: "3 weeks",
    bestFor: "Product, Growth, CX",
    worksFor: "PLG teams, mobile app developers, SaaS companies with low activation rates",
    businessQuestion: "Where exactly in the first-time experience do new users lose momentum and never come back?",
    touchpoints: ["New User Interviews", "Funnel Analytics + Qual"],
    deliverables: ["Dropout point map", "Activation friction scorecard", "Quick-win playbook"],
    urgencySignal: "You're acquiring users but Day-7 retention is below 20%",
    whenToUse: "When activation metrics are below target or before redesigning the onboarding flow",
    owner: "Growth PM / Product Lead",
    methodDetails: "New user interviews at key funnel stages combined with analytics-backed qualitative analysis, pinpointing the exact screens and steps where momentum dies.",
    sampleInsight: "The 'invite your team' step (Step 3 of 5) causes 44% of drop-offs. Users think they must invite someone to continue. Making it skippable recovers 31% of lost users.",
    color: "#22C55E",
    bgGlow: "bg-green-500/10",
    roles: ["all", "product", "growth"]
  },

  // ── Brand & Communications ─────────────────────────
  {
    id: "brand-health",
    name: "Brand Health & Perception Tracking",
    outcome: "Track awareness & sentiment",
    roiMetric: "Detect brand shifts 4× faster",
    timeToInsight: "Continuous",
    agencyTimeline: "Quarterly batch",
    bestFor: "Brand Leads, CMOs",
    worksFor: "Brand teams running campaigns, CMOs reporting to boards, teams in competitive markets",
    businessQuestion: "Are we gaining awareness, consideration, and trust - or are competitors stealing our position?",
    touchpoints: ["Tracking Surveys", "Social Listening"],
    deliverables: ["Brand funnel metrics", "Competitive perception map", "Trend delta reports"],
    urgencySignal: "You can't tell if your last campaign moved brand metrics or if a competitor is closing the gap",
    whenToUse: "As an always-on tracker, before/after major campaigns, or during competitive threats",
    owner: "Brand Lead / CMO",
    methodDetails: "Continuous tracking surveys combined with social listening, measuring aided/unaided awareness, consideration, preference, and NPS with competitive benchmarking and trend alerts.",
    sampleInsight: "Unaided awareness jumped 8 points post-campaign (to 34%), but consideration only moved 2 points. The campaign drove fame but not intent. Competitor Y is now within 3 points.",
    color: "#F97316",
    bgGlow: "bg-orange-500/10",
    roles: ["all", "brand"]
  },
  {
    id: "messaging",
    name: "Messaging & Positioning Research",
    outcome: "Find words that convert",
    roiMetric: "+35% landing page conversion",
    timeToInsight: "48 hours",
    agencyTimeline: "3 weeks",
    bestFor: "Brand, Growth, Founders",
    worksFor: "Brand teams crafting positioning, growth teams optimizing landing pages, founders pitching",
    businessQuestion: "Which value proposition framing drives the most clarity, relevance, and urgency in our ICP?",
    touchpoints: ["Message Testing Surveys", "Think-aloud Interviews"],
    deliverables: ["Message ranking by ICP segment", "Winning value prop", "Tagline candidates"],
    urgencySignal: "Your landing page conversion is below 3% and you suspect the value prop isn't landing",
    whenToUse: "Before a brand refresh, website relaunch, or major campaign brief",
    owner: "Brand Lead / Growth Lead",
    methodDetails: "Message testing surveys with think-aloud interviews, evaluating value propositions on clarity, relevance, differentiation, and urgency across ICP segments.",
    sampleInsight: "'Save 10 hours a week' outperforms 'AI-powered automation' by 2.4x on clarity and 1.8x on purchase intent. Your ICP doesn't care about the technology — they care about time saved.",
    color: "#EC4899",
    bgGlow: "bg-pink-500/10",
    roles: ["all", "brand", "growth", "founder"]
  },

  // ── Revenue & Pricing ──────────────────────────────
  {
    id: "pricing",
    name: "Pricing Elasticity Study",
    outcome: "Optimize margin & ARPU",
    roiMetric: "Find the 20% premium gap",
    timeToInsight: "1 week",
    agencyTimeline: "6 weeks",
    bestFor: "Founders, Revenue, Category",
    worksFor: "Founders setting initial pricing, revenue teams optimizing tiers, category managers negotiating",
    businessQuestion: "What is the price ceiling before demand drops, and what features justify premium tiers?",
    touchpoints: ["Van Westendorp Surveys", "Gabor-Granger", "Conjoint"],
    deliverables: ["WTP curves", "Optimal price band", "Feature-value bundles"],
    urgencySignal: "You set your price 18 months ago based on a hunch and have never tested elasticity",
    whenToUse: "Before a price change, when launching a new tier, or during annual pricing reviews",
    owner: "Founder / Head of Revenue",
    methodDetails: "Van Westendorp price sensitivity surveys, Gabor-Granger demand curves, and conjoint analysis to map willingness-to-pay at each price point and identify optimal feature-price bundles.",
    sampleInsight: "Optimal price point is $29/mo (current: $19/mo). The 'too expensive' threshold doesn't kick in until $39. A $29 price with 'priority support' bundled has 89% acceptance vs. 71% alone.",
    color: "#10B981",
    bgGlow: "bg-emerald-500/10",
    roles: ["all", "revenue", "founder", "category"]
  },
  {
    id: "subscription-churn",
    name: "Subscription & Plan Optimization",
    outcome: "Maximize LTV per cohort",
    roiMetric: "-25% subscription churn",
    timeToInsight: "5 days",
    agencyTimeline: "4 weeks",
    bestFor: "Revenue, Product, Retention",
    worksFor: "SaaS companies, subscription e-commerce, membership businesses",
    businessQuestion: "Is our plan structure, billing cycle, or feature gating causing unnecessary subscriber drop-off?",
    touchpoints: ["Subscriber Interviews", "Plan Preference Surveys"],
    deliverables: ["Plan architecture recommendation", "Upgrade trigger map", "Churn-risk segmentation"],
    urgencySignal: "Plan downgrades are rising and you don't know if it's feature gating, billing friction, or value",
    whenToUse: "When subscription churn or downgrade rates exceed targets",
    owner: "Revenue Lead / Product Lead",
    methodDetails: "Deep subscriber interviews at upgrade, downgrade, and cancel moments combined with plan preference surveys to map ideal tier structures and features that justify premium.",
    sampleInsight: "62% of downgraders say they only use 2 of 8 Pro features. A 'Pro Lite' tier at $15/mo (vs $25 Pro) with those 2 features would retain an estimated 45% of downgraders.",
    color: "#A855F7",
    bgGlow: "bg-purple-500/10",
    roles: ["all", "revenue", "cx"]
  },
  {
    id: "promo-elasticity",
    name: "Promotion & Discount Sensitivity",
    outcome: "Stop margin erosion",
    roiMetric: "Right-size promos, save 10% margin",
    timeToInsight: "3 days",
    agencyTimeline: "3 weeks",
    bestFor: "Revenue, Growth, Category",
    worksFor: "Revenue teams, growth marketers running promotions, category managers managing trade spend",
    businessQuestion: "Are our discounts actually driving incremental purchases or just training customers to wait for sales?",
    touchpoints: ["Promo Response Surveys", "Purchase History Analysis"],
    deliverables: ["Discount sensitivity bands", "Promo cannibalization estimate", "Optimal promo calendar"],
    urgencySignal: "Your promo frequency has doubled but incremental revenue per promo keeps shrinking",
    whenToUse: "Before setting the annual promo calendar or when promo ROI is declining",
    owner: "Revenue Lead / Growth Lead",
    methodDetails: "Promotion response surveys combined with purchase history analysis to measure true incrementality, discount sensitivity bands, and the 'trained to wait' effect in your customer base.",
    sampleInsight: "34% of 'sale buyers' would have purchased at full price within 7 days. Your 20% discount is effectively a $4.80 gift to existing demand. A 10% discount drives 91% of the same volume.",
    color: "#0D9488",
    bgGlow: "bg-teal-500/10",
    roles: ["all", "revenue", "growth"]
  },

  // ── Platforms & Marketplaces ──────────────────────
  {
    id: "marketplace",
    name: "Marketplace Liquidity Research",
    outcome: "Balance supply & demand",
    roiMetric: "2× faster market liquidity",
    timeToInsight: "1 week",
    agencyTimeline: "5 weeks",
    bestFor: "Platform PMs, Marketplace GMs",
    worksFor: "Two-sided marketplace operators, platform teams, gig economy companies",
    businessQuestion: "Is our supply churning because demand density is too low, or because onboarding friction is too high?",
    touchpoints: ["Dual-sided Interviews", "Provider Churn Surveys"],
    deliverables: ["Supply vs Demand friction map", "Liquidity blocker ranking", "Onboarding redesign brief"],
    urgencySignal: "Supply-side churn is above 15% and you can't isolate whether it's demand density or onboarding friction",
    whenToUse: "When marketplace take-rate or GMV growth stalls despite acquisition spend",
    owner: "Platform PM / Marketplace GM",
    methodDetails: "Dual-sided interviews with both supply and demand participants, combined with provider churn surveys, to map friction asymmetries and identify the binding constraint on liquidity.",
    sampleInsight: "Providers aren't churning because of low demand — 72% say they get enough leads. They churn because payment arrives in 14 days. Competitors pay in 2. Switching to instant pay retains 3x more.",
    color: "#38BDF8",
    bgGlow: "bg-sky-500/10",
    roles: ["all", "product", "growth"]
  },
];

// ─── Role Filter Tabs ───────────────────────────────
const categories = [
  { id: "all" as RoleId, label: "All Studies" },
  { id: "founder" as RoleId, label: "Founders & Strategy" },
  { id: "npd" as RoleId, label: "New Product Dev" },
  { id: "category" as RoleId, label: "Category & Merch" },
  { id: "growth" as RoleId, label: "Growth & Marketing" },
  { id: "cx" as RoleId, label: "Customer Experience" },
  { id: "product" as RoleId, label: "Product & UX" },
  { id: "brand" as RoleId, label: "Brand & Comms" },
  { id: "revenue" as RoleId, label: "Revenue & Pricing" },
];

// ─── Component ──────────────────────────────────────
export default function StudiesSection() {
  const [activeCategory, setActiveCategory] = useState<RoleId>("all");
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.1 });
  useSectionVisibility("studies", sectionRef);

  useRegisterParticleTargets("researchNeeds", sectionRef as unknown as RefObject<HTMLElement>, [".particle-target-research"], isInView);

  // Prevent background scroll & hide navbar when modal is open
  useEffect(() => {
    if (selectedStudy) {
      document.body.style.overflow = "hidden";
      document.documentElement.setAttribute("data-study-modal", "open");
    } else {
      document.body.style.overflow = "unset";
      document.documentElement.removeAttribute("data-study-modal");
    }
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.removeAttribute("data-study-modal");
    };
  }, [selectedStudy]);

  const filteredStudies = useMemo(() => studiesList.filter(s => s.roles.includes(activeCategory)), [activeCategory]);
  const collapsedLimit = 5; // 5 cards + 1 "+XX" tile = 2 full rows on desktop
  const totalStudyCount = 60;
  const capped = Math.min(visibleCount, filteredStudies.length);
  const visibleStudies = useMemo(() => filteredStudies.slice(0, capped), [filteredStudies, capped]);
  const hasMore = capped < filteredStudies.length;
  const isExpanded = capped > collapsedLimit;

  // Reset visible count when switching categories
  const handleCategoryChange = useCallback((id: RoleId) => {
    setActiveCategory(id);
    setVisibleCount(collapsedLimit);
    const count = studiesList.filter(s => s.roles.includes(id)).length;
    trackEvent(EventName.STUDY_FILTER, { filter_role: id, results_count: count });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="studies"
      data-section-name="studies-section"
      className="relative z-10 py-24 lg:py-32"
      style={{
        background: "linear-gradient(180deg, #FBF4EC 0%, #FDF8F2 20%, #FFFFFF 45%, #FFFFFF 70%, #FBF4EC 100%)"
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

        {/* ── Section Header ───────────────────────── */}
        <div className="mb-14">
          <motion.div
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full mb-5 whitespace-nowrap max-w-full"
            style={{
                background: "linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 100%)",
                border: "1px solid rgba(0,0,0,0.06)",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
              <span className="text-[10px] sm:text-[12px] font-semibold uppercase tracking-[0.08em] sm:tracking-[0.1em] text-maze-black whitespace-nowrap">
                  Intelligence Platform
              </span>
              <span className="text-[10px] sm:text-[12px] text-maze-black/30">|</span>
              <span className="text-[10px] sm:text-[12px] font-medium text-maze-black/60 whitespace-nowrap">
                  Continuous Studies
              </span>
          </motion.div>

          <h2 className="font-display text-[40px] lg:text-[56px] text-maze-black leading-[1.05] tracking-tight mb-3">
            Studies
          </h2>
          <p className="text-xl lg:text-2xl text-maze-black/80 font-medium mb-4">
            From hypothesis to 'holy shit' faster.
          </p>
          <p className="text-neutral-500 text-lg lg:text-xl max-w-2xl leading-relaxed">
            From discovery to pricing to churn - direct-customer evidence that helps teams across your company make decisions, not guesses.
          </p>
        </div>

        {/* ── Role Filter Tabs ─────────────────────── */}
        <div className="mb-10 w-full overflow-hidden">
          <div className="flex gap-2 pb-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-300 whitespace-nowrap ${activeCategory === cat.id
                  ? "bg-maze-black text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
                  : "bg-white/60 text-neutral-500 hover:bg-white hover:text-maze-black shadow-sm"
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Study Grid ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-min">
          {visibleStudies.map((study, idx) => (
            <div
              key={study.id}
              onClick={() => {
                trackEvent(EventName.STUDY_CARD_CLICK, { study_name: study.name, study_category: study.id, card_index: idx, filter_active: activeCategory });
                trackEvent(EventName.STUDY_MODAL_OPEN, { study_name: study.name, study_category: study.id });
                window.dispatchEvent(new CustomEvent("sq:study_modal"));
                setSelectedStudy(study);
              }}
              className="study-card bg-white rounded-[28px] p-7 border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer group hover:-translate-y-1 flex flex-col relative overflow-hidden"
            >
              {/* Color accent bar */}
              <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: study.color }} />

              <div className="relative z-10 flex flex-col flex-1">
                {/* Icon */}
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full mb-4" style={{ backgroundColor: study.color + '12', color: study.color }}>
                  <TrendingUp className="w-4 h-4" />
                </span>

                {/* Name */}
                <h4 className="text-lg font-semibold text-maze-black leading-snug mb-1.5 font-display tracking-tight">
                  {study.name}
                </h4>

                {/* ROI Title */}
                <p className="text-[13px] font-semibold uppercase tracking-wide mb-4" style={{ color: study.color }}>
                  {study.outcome}
                </p>

                {/* Primary metric */}
                <p className="text-xl font-display text-maze-black tracking-tight border-l-2 pl-3 mb-5 mt-auto" style={{ borderColor: study.color }}>
                  {study.roiMetric}
                </p>

                {/* Speed contrast */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-3.5 text-[12px] font-medium">
                  <span className="flex items-center gap-1.5 text-maze-black">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> {study.timeToInsight}
                  </span>
                  <span className="text-neutral-300 text-[11px]">
                    vs {study.agencyTimeline} traditional
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* +XX More Studies Tile */}
          <div
            className="bg-neutral-100/80 rounded-[28px] p-7 border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-white hover:border-neutral-300 hover:shadow-lg"
          >
            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-5 text-neutral-400 group-hover:text-maze-black group-hover:scale-110 transition-all duration-300 border border-neutral-100">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <h4 className="text-2xl font-display font-semibold text-maze-black mb-1.5">
              +{totalStudyCount} more
            </h4>
            <p className="text-neutral-500 text-sm font-medium max-w-[200px]">
              Full library of proven research frameworks, ready to launch.
            </p>
          </div>
        </div>

        {/* Load More / Show Less Buttons */}
        <div className="flex justify-center gap-3 mt-8">
          {hasMore && (
            <button
              onClick={() => setVisibleCount(prev => prev + 6)}
              className="px-8 py-3 rounded-full bg-white text-maze-black font-semibold text-[14px] shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
            >
              Load more ({filteredStudies.length - capped} remaining) <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {isExpanded && (
            <button
              onClick={() => setVisibleCount(collapsedLimit)}
              className="px-8 py-3 rounded-full bg-white text-maze-black font-semibold text-[14px] shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 hover:-translate-y-0.5 transition-all duration-300"
            >
              Show less
            </button>
          )}
        </div>

        {/* ── Custom Study Hero Banner ──────────────── */}
        <div className="mt-8 particle-target-research">
          <div className="relative bg-[#0F0F0F] rounded-[24px] sm:rounded-[32px] overflow-hidden group hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-500 p-6 sm:p-8 lg:p-12 flex flex-col items-center text-center gap-6 sm:gap-8 lg:flex-row lg:items-center lg:text-left lg:justify-between lg:gap-10">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5A36]/15 via-transparent to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[#FF5A36] blur-[150px] opacity-15 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-[11px] font-bold uppercase tracking-[0.15em] mb-6 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" /> Custom Study
              </div>
              <h3 className="text-2xl lg:text-4xl font-display text-white mb-4 leading-tight">
                Don't see what you need?
              </h3>
              <p className="text-white/50 text-base lg:text-lg leading-relaxed">
                You give the brief. Our AI agents do the rest. They recruit, interview, and catch every insight a human would miss. Analyst-grade depth, at{" "}
                <span className="text-[#FF5A36] font-semibold">lightning speed.</span>
              </p>
            </div>

            <div className="relative z-10 shrink-0 max-w-full">
              <button className="px-4 sm:px-8 py-2.5 sm:py-4 bg-white text-maze-black rounded-full font-semibold text-xs sm:text-base flex items-center gap-1.5 sm:gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg whitespace-nowrap">
                Launch Custom Study
                <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider bg-orange-100 text-[#FF5A36] rounded-full whitespace-nowrap sm:ml-1">Coming Soon</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded Modal - Single Fold Detail View ─── */}
      <AnimatePresence>
        {selectedStudy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center"
            onKeyDown={(e) => { if (e.key === 'Escape') { trackEvent(EventName.STUDY_MODAL_CLOSE, { study_name: selectedStudy.name, close_method: "escape" }); setSelectedStudy(null); } }}
            tabIndex={-1}
            ref={(el) => el?.focus()}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xl cursor-pointer"
              onClick={() => { trackEvent(EventName.STUDY_MODAL_CLOSE, { study_name: selectedStudy!.name, close_method: "overlay" }); setSelectedStudy(null); }}
            />

            {/* Modal Panel - premium floating overlay */}
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.8 }}
              className="relative z-10 w-[96vw] max-w-[1200px] h-[92vh] bg-white flex flex-col overflow-hidden rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.18)]"
              onClick={(e) => e.stopPropagation()}
            >

              {/* ── TOP BAR ── */}
              <div className="flex items-center justify-between px-6 lg:px-10 py-4 border-b border-neutral-100 shrink-0">
                <motion.button
                  onClick={() => { trackEvent(EventName.STUDY_MODAL_CLOSE, { study_name: selectedStudy!.name, close_method: "button" }); setSelectedStudy(null); }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center transition-colors text-neutral-600 hover:text-neutral-900"
                >
                  <X className="w-4.5 h-4.5" />
                </motion.button>
                <img src="/su_wordmark_transparent.svg" alt="SquareUp" className="h-6" />
              </div>

              {/* ── TWO-COLUMN CONTENT ── */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-[55%_45%] overflow-y-auto lg:overflow-hidden">

                {/* ═══ LEFT COLUMN - Narrative ═══ */}
                <div className="p-6 lg:p-10 lg:overflow-y-auto flex flex-col gap-5 lg:gap-7 lg:border-r border-neutral-100 min-h-0">

                  {/* Study Name + Outcome */}
                  <div>
                    <h2 className="text-[28px] lg:text-[36px] font-display font-bold text-maze-black leading-[1.1] tracking-tight mb-2">
                      {selectedStudy.name}
                    </h2>
                    <p className="text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: selectedStudy.color }}>
                      {selectedStudy.outcome}
                    </p>
                  </div>

                  {/* Business Question */}
                  <div
                    className="pl-5 border-l-[4px] py-2 rounded-r-lg"
                    style={{ borderColor: selectedStudy.color, backgroundColor: hexToRgba(selectedStudy.color, 0.03) }}
                  >
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.12em] mb-1.5">The question this answers</p>
                    <p className="text-[17px] lg:text-[20px] font-display font-medium text-maze-black leading-snug tracking-tight">
                      &ldquo;{selectedStudy.businessQuestion}&rdquo;
                    </p>
                  </div>

                  {/* Method Details */}
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.12em] mb-2.5">Method</p>
                    <p className="text-[13px] lg:text-[14px] text-neutral-600 leading-relaxed">
                      {selectedStudy.methodDetails}
                    </p>
                  </div>

                  {/* Touchpoints */}
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.12em] mb-2.5">Touchpoints</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStudy.touchpoints.map((t, i) => {
                        const getIcon = (tp: string) => {
                          const lower = tp.toLowerCase();
                          if (lower.includes('video') || lower.includes('call')) return <Video className="w-3 h-3" />;
                          if (lower.includes('whatsapp') || lower.includes('diary') || lower.includes('diaries')) return <MessageCircle className="w-3 h-3" />;
                          if (lower.includes('interview')) return <Mic className="w-3 h-3" />;
                          if (lower.includes('survey')) return <FileText className="w-3 h-3" />;
                          if (lower.includes('test') || lower.includes('usability')) return <Users className="w-3 h-3" />;
                          return <BarChart3 className="w-3 h-3" />;
                        };
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-medium border"
                            style={{
                              backgroundColor: hexToRgba(selectedStudy.color, 0.06),
                              borderColor: hexToRgba(selectedStudy.color, 0.12),
                              color: selectedStudy.color,
                            }}
                          >
                            {getIcon(t)}
                            {t}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div>
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.12em] mb-2.5">What you get</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStudy.deliverables.map((d, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-50 border border-neutral-100 rounded-lg text-[12px] font-medium text-maze-black"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ═══ RIGHT COLUMN - Structured Data ═══ */}
                <div className="p-6 lg:p-10 lg:overflow-y-auto flex flex-col gap-5 lg:gap-6 bg-neutral-50/50 min-h-0">

                  {/* Hero Stats Row — Impact + Time to Insight */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">Time to Insight</span>
                      </div>
                      <p className="text-[22px] font-display font-bold text-maze-black tracking-tight">{selectedStudy.timeToInsight}</p>
                      <p className="text-[11px] text-neutral-400 mt-1">vs {selectedStudy.agencyTimeline} traditional</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Briefcase className="w-4 h-4 text-neutral-400" />
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">Usually owned by</span>
                      </div>
                      <p className="text-[15px] font-bold text-maze-black leading-snug">{selectedStudy.owner}</p>
                    </div>
                  </motion.div>

                  {/* When to Use + Best For — compact metadata row */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Target className="w-4 h-4 text-neutral-400" />
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">When to use</span>
                      </div>
                      <p className="text-[13px] text-neutral-700 leading-snug">{selectedStudy.whenToUse}</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Users className="w-4 h-4 text-neutral-400" />
                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">Best for</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStudy.bestFor.split(', ').map((role, i) => (
                          <span key={i} className="px-2.5 py-1 bg-neutral-100 rounded-lg text-[11px] font-medium text-neutral-700">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Common Trigger — hero persuasion card */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="rounded-2xl p-5 border"
                    style={{
                      backgroundColor: hexToRgba(selectedStudy.color, 0.05),
                      borderColor: hexToRgba(selectedStudy.color, 0.12),
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4" style={{ color: selectedStudy.color }} />
                      <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: selectedStudy.color }}>Common trigger</span>
                    </div>
                    <p className="text-[14px] text-maze-black leading-relaxed font-medium">{selectedStudy.urgencySignal}</p>
                  </motion.div>

                  {/* Sample Insight — proof moment */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="rounded-2xl p-5 border-l-[4px] bg-white border border-neutral-100"
                    style={{ borderLeftColor: selectedStudy.color }}
                  >
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.1em] mb-2">What you&apos;ll discover</p>
                    <p className="text-[13px] lg:text-[14px] text-neutral-700 leading-relaxed italic">
                      &ldquo;{selectedStudy.sampleInsight}&rdquo;
                    </p>
                  </motion.div>

                  {/* Impact Metric — bold closer */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="rounded-2xl p-5 bg-white border border-neutral-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  >
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.1em] mb-1.5">Impact</p>
                    <p className="text-[22px] font-display font-bold text-maze-black tracking-tight">
                      <AnimatedMetric value={selectedStudy.roiMetric} />
                    </p>
                  </motion.div>

                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
