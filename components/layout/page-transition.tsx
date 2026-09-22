import { ViewTransition, type ReactNode } from "react";

export type PageMotionStep = 0 | 1 | 2 | 3 | 4;

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      name="page-content"
      default={{
        "locale-change": "page-root-neutral",
        default: "page-root",
      }}
    >
      {children}
    </ViewTransition>
  );
}

export function PageMotionItem({
  children,
  step = 0,
  enter = true,
  exit = true,
}: {
  children: ReactNode;
  step?: PageMotionStep;
  enter?: boolean;
  exit?: boolean;
}) {
  return (
    <ViewTransition
      enter={
        enter
          ? {
              "locale-change": "page-item-neutral-in",
              default: `page-item-in-${step}`,
            }
          : "none"
      }
      exit={
        exit
          ? {
              "locale-change": "page-item-neutral-out",
              default: `page-item-out-${step}`,
            }
          : "none"
      }
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
