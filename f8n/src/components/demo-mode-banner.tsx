"use client";

import { Sparkles } from "lucide-react";
import { useDemoMode } from "@/lib/demo/mode";

/** A floating, fixed-position badge (not part of document flow) so it can never
 * affect any page's layout - including the builder canvas, which relies on
 * exactly filling the viewport height. */
export function DemoModeBanner() {
  const [demoMode, setDemoMode] = useDemoMode();

  if (!demoMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-medium text-amber-950 shadow-lg">
      <Sparkles className="h-3.5 w-3.5" />
      Demo Mode
      <button onClick={() => setDemoMode(false)} className="ml-1 underline underline-offset-2 hover:no-underline">
        Turn off
      </button>
    </div>
  );
}
