"use client";

import { useState } from "react";

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

  if (variant === "opponent" && logoUrl && !broken) {
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
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        variant === "inter"
          ? "bg-gradient-to-br from-inter-navy to-inter-black text-white"
          : "bg-zinc-100 text-zinc-500"
      }`}
    >
      {variant === "inter" ? "IN" : label.slice(0, 2).toUpperCase()}
    </span>
  );
}
