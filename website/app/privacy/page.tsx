import Link from "next/link";

/**
 * /privacy — Privacy & Cookies
 * ----------------------------------------------------------------------
 * Industry-standard layout: the Footer's "Privacy Policy" link routes
 * here. The two published documents (Website Privacy Policy + Cookie
 * Policy) live as PDFs under /public/legal/ and open in the browser's
 * native PDF viewer in a new tab.
 *
 * Other internal legal documents (MSA, DPA, AUP, participant notices,
 * consent script) intentionally stay off the public site — they're
 * customer-contract / interview-runtime artifacts, not website policies.
 * ──────────────────────────────────────────────────────────────────── */

const LAST_UPDATED = "May 25, 2026";
const CONTACT_EMAIL = "hello@joinsquareup.com";

type LegalDoc = {
  slug: string; // file basename under /public/legal/
  title: string;
  summary: string;
};

const DOCS: LegalDoc[] = [
  {
    slug: "website-privacy-policy.pdf",
    title: "Website Privacy Policy",
    summary:
      "What information SquareUp collects when you visit joinsquareup.com, how we use it, and the rights you have over your data.",
  },
  {
    slug: "cookie-policy.pdf",
    title: "Cookie Policy",
    summary:
      "The cookies and similar technologies we use on the site, what they do, and how you can control them.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FBF4EC] text-[#0b132b]">
      <div className="max-w-[760px] mx-auto px-6 sm:px-8 pt-16 sm:pt-24 pb-24">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#FF5A36] font-semibold hover:underline mb-10"
        >
          <span aria-hidden>←</span> Back to home
        </Link>

        {/* Header */}
        <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#FF5A36] mb-3">
          Privacy &amp; Cookies
        </p>
        <h1 className="font-display font-black text-[#0b132b] leading-[1.08] tracking-[-0.025em] text-[clamp(32px,4.5vw,52px)] mb-4">
          Privacy at SquareUp.
        </h1>
        <p className="text-[16px] leading-[1.65] text-[rgba(11,19,43,0.65)] max-w-[620px] mb-6">
          How we handle your information on joinsquareup.com.
        </p>
        <p className="text-[12px] uppercase tracking-[0.12em] font-bold text-[#757575] mb-12">
          Last updated: {LAST_UPDATED}
        </p>

        {/* Documents */}
        <ul className="flex flex-col gap-3">
          {DOCS.map((doc) => (
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
                      <span
                        aria-hidden
                        className="inline-flex items-center justify-center w-7 h-7 rounded-[6px] bg-[rgba(232,80,26,0.10)] text-[#FF5A36] text-[10px] font-extrabold tracking-tight flex-shrink-0"
                      >
                        PDF
                      </span>
                      <h2 className="text-[15px] sm:text-[16px] font-extrabold text-[#0b132b] tracking-[-0.005em] leading-tight">
                        {doc.title}
                      </h2>
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

        {/* Footer note + contact */}
        <div className="mt-16 pt-8 border-t border-[#e8e0d8]">
          <h2 className="font-display text-[18px] font-extrabold text-[#0b132b] mb-2">
            Questions?
          </h2>
          <p className="text-[14px] leading-[1.65] text-[rgba(11,19,43,0.65)]">
            For privacy-related questions, email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[#FF5A36] font-semibold hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            . We respond within two business days.
          </p>
        </div>
      </div>
    </main>
  );
}
