export type ToolCategory = "focus" | "time";
export type ToolStatus = "stable" | "beta";

export interface ToolCatalogEntry {
  slug: string;
  href: string;
  category: ToolCategory;
  status: ToolStatus;
  order: number;
  visible: boolean;
}

export const TOOL_CATALOG: ToolCatalogEntry[] = [
  {
    slug: "pomodoro",
    href: "/tools/pomodoro",
    category: "focus",
    status: "stable",
    order: 10,
    visible: true,
  },
];

export function getVisibleTools() {
  return TOOL_CATALOG.filter((tool) => tool.visible).sort(
    (left, right) => left.order - right.order,
  );
}
