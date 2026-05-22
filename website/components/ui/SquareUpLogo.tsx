"use client";

import Image from "next/image";

export default function SquareUpLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/su_d_wordmark_transparent.svg"
      alt="SquareUp"
      width={120}
      height={32}
      className={className}
    />
  );
}
