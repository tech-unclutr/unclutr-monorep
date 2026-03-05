"use client";

export default function LogoNotch() {
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      {}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none -z-20"
        style={{
          width: "100vw",
          height: "clamp(48px, 13vw, 68px)",
          background: "linear-gradient(to bottom, rgba(245, 242, 237, 0.95) 0%, rgba(245, 242, 237, 0.8) 50%, rgba(245, 242, 237, 0.3) 80%, transparent 100%)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />
      {}
      {}
      <img
        src="/su_wordmark_transparent.svg"
        alt="Square Up"
        style={{ height: "clamp(38px, 10vw, 54px)", width: "auto", marginTop: "max(6px, env(safe-area-inset-top, 6px))" }}
      />
      {}
      <div
        className="absolute top-0 backdrop-blur-xl -z-10"
        style={{
          width: "clamp(160px, 50vw, 220px)",
          height: "clamp(52px, 15vw, 72px)",
          background: "rgba(245, 242, 237, 0.92)",
          borderRadius: "0 0 20px 20px",
          border: "1px solid rgba(255, 255, 255, 0.45)",
          borderTop: "none",
        }}
      />
    </div>
  );
}
