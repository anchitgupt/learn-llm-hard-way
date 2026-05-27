import { motion, type Transition, type Variants } from "motion/react";
import { type PropsWithChildren, type HTMLAttributes } from "react";

// Omit event props that conflict with motion/react's own signatures.
type SafeHTMLDivProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "onDrag" | "onDragEnd" | "onDragEnter" | "onDragExit" | "onDragLeave" | "onDragOver" | "onDragStart"
  | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] } }
};

export const panelEnter: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] } }
};

export const listStagger: Variants = {
  show: { transition: { staggerChildren: 0.04 } }
};

export const drawPath: Variants = {
  hidden: { pathLength: 0 },
  show: { pathLength: 1, transition: { duration: 0.6, ease: "easeInOut" } }
};

export const springViz: Transition = { type: "spring", stiffness: 180, damping: 22 };

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type RevealProps = PropsWithChildren<SafeHTMLDivProps>;

export function Reveal({ children, ...rest }: RevealProps) {
  if (prefersReducedMotion()) {
    return <div {...rest}>{children}</div>;
  }
  return (
    <motion.div variants={panelEnter} initial="hidden" animate="show" {...rest}>
      {children}
    </motion.div>
  );
}

/**
 * Stagger orchestrates child motion components. The container itself has
 * no `hidden` state; children must carry their own variants (e.g. wrap
 * each child in `<Reveal>` or use `fadeIn`/`panelEnter`). Bare `<div>`
 * children will not animate.
 */
export function Stagger({ children, ...rest }: RevealProps) {
  if (prefersReducedMotion()) {
    return <div {...rest}>{children}</div>;
  }
  return (
    <motion.div variants={listStagger} animate="show" {...rest}>
      {children}
    </motion.div>
  );
}
