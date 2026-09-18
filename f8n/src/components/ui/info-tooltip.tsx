"use client";

import { Info } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/** A small "(i)" affordance that reveals `text` on hover/focus - used to keep a
 * page's/block's explanation out of the way until someone actually wants it,
 * instead of always-on paragraph text.
 *
 * Portaled to `document.body` and positioned in fixed coordinates rather than
 * plain CSS `absolute` + `group-hover`, because several places this is used
 * (the block palette, the sidebar) are inside narrow `overflow-auto`
 * containers that would otherwise clip a wide tooltip bubble. */
export function InfoTooltip({
  text,
  className,
  iconClassName,
}: {
  text: string;
  className?: string;
  iconClassName?: string;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  };
  const hide = () => setPosition(null);

  return (
    <span
      ref={anchorRef}
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <Info
        className={cn("h-3.5 w-3.5 shrink-0 cursor-help text-muted-foreground hover:text-foreground", iconClassName)}
        tabIndex={0}
        aria-label={text}
      />
      {position &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            className="pointer-events-none fixed z-[100] w-64 -translate-x-1/2 rounded-md border border-border bg-popover p-2 text-xs font-normal normal-case text-popover-foreground shadow-md"
            style={{ top: position.top, left: position.left }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
