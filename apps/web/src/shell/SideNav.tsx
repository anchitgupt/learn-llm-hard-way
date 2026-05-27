import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarDays, LayoutGrid, Network, BookOpen, MessageSquare, Library,
  Boxes, AlertOctagon, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "learn-llm.sidebar.collapsed";

interface NavEntry {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  end?: boolean;
}

const ENTRIES: NavEntry[] = [
  { to: "/",          label: "Today",       icon: CalendarDays, end: true },
  { to: "/tracks",    label: "Tracks",      icon: LayoutGrid },
  { to: "/concepts",  label: "Concept Map", icon: Network },
  { to: "/chat",      label: "Chat",        icon: MessageSquare },
  { to: "/glossary",  label: "Glossary",    icon: Library },
  { to: "/artifacts", label: "Artifacts",   icon: Boxes },
  { to: "/failures",  label: "Failures",    icon: AlertOctagon }
];

export function SideNav() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  });

  // Track whether collapsed has been changed by the user (skip writing on initial mount)
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex flex-col justify-between border-r border-border-subtle bg-bg-surface",
        "transition-[width] duration-base ease-out",
        collapsed ? "w-14" : "w-60"
      )}
    >
      <ul className="flex flex-col gap-1 p-2">
        {ENTRIES.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2",
                  "text-[14px] leading-[20px] text-text-muted hover:text-text-primary hover:bg-bg-elevated",
                  "border-l border-transparent",
                  isActive && "bg-accent-quiet text-accent border-accent"
                )
              }
            >
              <Icon aria-hidden className="h-4 w-4 shrink-0" />
              {collapsed ? null : <span>{label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      <button
        type="button"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={() => setCollapsed((value) => !value)}
        className={cn(
          "m-2 flex items-center gap-2 rounded-md px-3 py-2",
          "text-[13px] leading-[16px] text-text-muted hover:text-text-primary hover:bg-bg-elevated"
        )}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        {collapsed ? null : <span>Collapse</span>}
      </button>
    </nav>
  );
}
