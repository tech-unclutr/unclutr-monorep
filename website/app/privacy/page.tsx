import Link from "next/link";

/**
 * /privacy — Legal & Privacy hub
 * ----------------------------------------------------------------------
 * Industry-standard layout: every legal document SquareUp publishes is
 * surfaced here from a single entry point (the Footer's "Privacy Policy"
 * link). Documents live as PDFs under /public/legal/ with kebab-case
 * URL slugs so each can be linked or shared directly.
 *
 * Grouped into three audience buckets:
 *   1. Privacy & data       — for everyone using the site / platform
 *   2. Customer agreements  — for B2B customers (MSA, DPA, AUP)
 *   3. Research participants — for people interviewed via SquareUp
 *
 * Each PDF opens in a new tab via the browser's native PDF viewer,
 * with rel="noopener noreferrer" for safety.
 * ──────────────────────────────────────────────────────────────────── */

const LAST_UPDATED = "May 25, 2026";
const CONTACT_EMAIL = "tech.unclutr@gmail.com";

type LegalDoc = {
  slug: string;       // file basename under /public/legal/
  title: string;
  summary: string;
};

type Section = {
  heading: string;
  intro: string;
  docs: LegalDoc[];
};

const SECTIONS: Section[] = [
  {
    heading: "Privacy & data",
    intro: "How SquareUp handles personal information across the website and platform.",
    docs: [
      {
        slug: "website-privacy-policy.pdf",
        title: "Website Privacy Policy",
        summary:
          "What we collect when you visit joinsquareup.com, how we use it, and the rights you have over your data.",
      },
      {
        slug: "cookie-policy.pdf",
        title: "Cookie Policy",
        summary:
          "The cookies and similar technologies we use on the site, what they do, and how you can control them.",
      },
    ],
  },
  {
    heading: "Customer agreements",
    intro: "Contractual terms that apply when your team uses the SquareUp platform.",
    docs: [
      {
        slug: "master-services-agreement.pdf",
        title: "Master Services Agreement",
        summary:
          "The core commercial terms governing SquareUp pilots and subscriptions.",
      },
      {
        slug: "data-processing-agreement.pdf",
        title: "Data Processing Agreement",
        summary:
          "GDPR-compliant DPA covering how SquareUp processes personal data on behalf of customers.",
      },
      {
        slug: "acceptable-use-policy.pdf",
        title: "Acceptable Use Policy",
        summary:
          "What customers may and may not do when using the SquareUp platform.",
      },
    ],
  },
  {
    heading: "Research participants",
    intro:
      "If you've been invited to an interview run through SquareUp, these explain what to expect.",
    docs: [
      {
        slug: "participant-privacy-notice.pdf",
        title: "Participant Privacy Notice",
        summary:
          "How SquareUp handles your personal information as a research interview participant.",
      },
      {
        slug: "participant-consent-script.pdf",
        title: "Participant Consent Script",
        summary:
          "The consent script read at the start of every voice interview run through SquareUp.",
      },
    ],
  },
];

export default function LegalHubPage() {
  return (
    <main className="min-h-screen bg-[#FBF4EC] text-[#0b132b]">
      <div className="max-w-[820px] mx-auto px-6 sm:px-8 pt-16 sm:pt-24 pb-24">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#FF5A36] font-semibold hover:underline mb-10"
        >
          <span aria-hidden>←</span> Back to home
        </Link>

        {/* Header */}
        <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#FF5A36] mb-3">
          Legal &amp; Privacy
        </p>
        <h1 className="font-display font-black text-[#0b132b] leading-[1.08] tracking-[-0.025em] text-[clamp(32px,4.5vw,52px)] mb-4">
          SquareUp legal documents.
        </h1>
        <p className="text-[16px] leading-[1.65] text-[rgba(11,19,43,0.65)] max-w-[640px] mb-6">
          The policies and agreements that govern how SquareUp works — for
          visitors, customers, and the people we interview. All documents open
          as PDFs in a new tab.
        </p>
        <p className="text-[12px] uppercase tracking-[0.12em] font-bold text-[#757575] mb-12">
          Last updated: {LAST_UPDATED}
        </p>

        {/* Sections */}
        <div className="flex flex-col gap-12">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-[22px] sm:text-[24px] font-extrabold text-[#0b132b] mb-2 tracking-[-0.005em]">
                {section.heading}
              </h2>
              <p className="text-[14px] leading-[1.6] text-[rgba(11,19,43,0.6)] mb-5">
                {section.intro}
              </p>

              <ul className="flex flex-col gap-3">
                {section.docs.map((doc) => (
                  <li key={doc.slug}>
                    <a
                      href={`/legal/${doc.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-white border border-[#e8e0d8] rounded-[14px] px-5 py-4 sm:px-6 sm:py-5 transition-all duration-200 hover:border-[#FF5A36] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            {/* PDF icon */}
                            <span
                              aria-hidden
                              className="inline-flex items-center justify-center w-7 h-7 rounded-[6px] bg-[rgba(232,80,26,0.10)] text-[#FF5A36] text-[10px] font-extrabold tracking-tight flex-shrink-0"
                            >
                              PDF
                            </span>
                            <h3 className="text-[15px] sm:text-[16px] font-extrabold text-[#0b132b] tracking-[-0.005em] leading-tight">
                              {doc.title}
                            </h3>
                          </div>
                          <p className="text-[13px] sm:text-[14px] text-[#4a4a4a] leading-[1.55] mt-1">
                            {doc.summary}
                          </p>
                        </div>
                        <span
                          aria-hidden
                          className="text-[#FF5A36] text-[18px] font-bold flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1 mt-1"
                        >
                          →
                        </span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Footer note + contact */}
        <div className="mt-16 pt-8 border-t border-[#e8e0d8]">
          <h2 className="font-display text-[18px] font-extrabold text-[#0b132b] mb-2">
            Questions?
          </h2>
          <p className="text-[14px] leading-[1.65] text-[rgba(11,19,43,0.65)]">
            For privacy or legal questions, email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[#FF5A36] font-semibold hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            . We respond within two business days.
          </p>
          <p className="mt-6 text-[12px] text-[#757575] leading-[1.6] italic">
            The documents above are SquareUp&apos;s current legal positions.
            Please review the most recent version of each before relying on it,
            and consult your own counsel for legal advice.
          </p>
        </div>
      </div>
    </main>
  );
}
