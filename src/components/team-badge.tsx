"use client";

import { useState } from "react";
import Image from "next/image";

export function TeamBadge({
  label,
  variant,
  logoUrl,
  size = 9,
}: {
  label: string;
  variant: "inter" | "opponent";
  logoUrl?: string | null;
  size?: 9 | 7;
}) {
  const [broken, setBroken] = useState(false);
  const sizeClass = size === 7 ? "size-7" : "size-9";
  const pixelSize = size === 7 ? 28 : 36;

  if (variant === "inter") {
    return (
      <Image
        src="/inter-logo.png"
        alt="Inter"
        width={pixelSize}
        height={pixelSize}
        className={`${sizeClass} shrink-0 rounded-full bg-zinc-100 object-contain`}
      />
    );
  }

  if (logoUrl && !broken) {
    return (
      <img
        src={logoUrl}
        alt={label}
        onError={() => setBroken(true)}
        className={`${sizeClass} shrink-0 rounded-full bg-zinc-100 object-contain p-1`}
      />
    );
  }

  return (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500`}
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}
