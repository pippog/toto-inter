"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
} as const;

const CONTAINER_TAGS = { div: motion.div, ul: motion.ul, ol: motion.ol };
const ITEM_TAGS = { div: motion.div, li: motion.li };

export function StaggerList({
  as = "div",
  children,
  className,
}: {
  as?: keyof typeof CONTAINER_TAGS;
  children: ReactNode;
  className?: string;
}) {
  const Component = CONTAINER_TAGS[as];
  return (
    <Component variants={containerVariants} initial="hidden" animate="show" className={className}>
      {children}
    </Component>
  );
}

export function StaggerItem({
  as = "div",
  children,
  className,
}: {
  as?: keyof typeof ITEM_TAGS;
  children: ReactNode;
  className?: string;
}) {
  const Component = ITEM_TAGS[as];
  return (
    <Component variants={itemVariants} className={className}>
      {children}
    </Component>
  );
}
