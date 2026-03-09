"use client";

import { useCTATracking } from "@/lib/analytics";

type Variant = "primary" | "primary-orange" | "secondary" | "ghost";
type Size = "default" | "small";

interface PilotCTAButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
  section: string;
  position?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  fullWidthMobile?: boolean;
}

export default function PilotCTAButton({
  label,
  href,
  onClick,
  section,
  position = "main",
  variant = "primary",
  size = "default",
  className = "",
  fullWidthMobile = false,
}: PilotCTAButtonProps) {
  const { trackCTA } = useCTATracking();

  const handleClick = () => {
    if (href) {
      trackCTA(label, href, section, position);
    }
    onClick?.();
  };

  const baseClasses =
    "relative overflow-hidden font-display tracking-[-0.02em] transition-all flex items-center justify-center group";

  const sizeClasses: Record<Size, string> = {
    default: "min-h-[56px] px-6 py-3 text-base rounded-xl",
    small: "min-h-[42px] px-5 py-2 text-[13px] rounded-full",
  };

  const variantClasses: Record<Variant, string> = {
    primary:
      "bg-maze-black text-white hover:bg-black active:scale-[0.97] pilot-cta-glow",
    "primary-orange":
      "bg-lime text-white hover:brightness-110 active:scale-[0.97] pilot-cta-glow-orange",
    secondary:
      "text-lime border border-lime/25 hover:bg-lime/[0.05] hover:border-lime/40 active:scale-[0.97]",
    ghost:
      "text-white border border-white/25 hover:border-white/50 hover:bg-white/10 active:scale-[0.97]",
  };

  const widthClasses = fullWidthMobile
    ? "w-full sm:w-auto sm:min-w-[280px]"
    : "";

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClasses} ${className}`;

  const shimmer = (
    <span className="pilot-cta-shimmer" aria-hidden="true" />
  );

  if (href) {
    return (
      <a href={href} onClick={handleClick} className={combinedClasses}>
        {shimmer}
        <span className="relative z-10">{label}</span>
      </a>
    );
  }

  return (
    <button onClick={handleClick} className={combinedClasses}>
      {shimmer}
      <span className="relative z-10">{label}</span>
    </button>
  );
}
