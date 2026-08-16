import { Skeleton } from "@/components/ui/skeleton";

/** Shown the instant a nav link is clicked, while the server renders the real
 * page. Without this Next.js has nothing to paint and the browser sits on the
 * previous screen — which is what made every click feel unresponsive, since
 * each page costs several DB round-trips before it can render.
 *
 * Lives at the (app) group level so every route inside the shell gets it from
 * one file, including routes added later. The shell itself (sidebar, top bar)
 * is in the layout, so it stays put and only this content area swaps.
 *
 * Deliberately quiet per DESIGN_SYSTEM.md's motion budget: one plain pulse,
 * no entrance stagger, no spinner. It mirrors the shared page shape — display
 * heading, supporting line, then content blocks — so the layout doesn't jump
 * when the real content arrives. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
      </section>

      <section className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </section>
    </div>
  );
}
