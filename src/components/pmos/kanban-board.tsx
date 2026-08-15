"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export type KanbanColumn<S extends string> = { id: S; label: string; color?: string };

export function KanbanBoard<T extends { id: string }, S extends string>({
  id,
  columns,
  items,
  getStatus,
  renderCard,
  onMove,
  emptyLabel = "Nothing here yet.",
}: {
  /** Stable, unique-per-instance id — required so dnd-kit's internally
   * generated aria ids match between server and client render (otherwise
   * mounting more than one board across navigations causes a hydration
   * mismatch, since dnd-kit's id counter isn't SSR-deterministic). */
  id: string;
  columns: KanbanColumn<S>[];
  items: T[];
  getStatus: (item: T) => S;
  renderCard: (item: T) => React.ReactNode;
  onMove: (item: T, newStatus: S) => void;
  emptyLabel?: string;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const byColumn = React.useMemo(() => {
    const map = new Map<S, T[]>();
    for (const col of columns) map.set(col.id, []);
    for (const item of items) {
      const s = getStatus(item);
      map.get(s)?.push(item);
    }
    return map;
  }, [items, columns, getStatus]);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = over.id as S;
    const item = items.find((i) => i.id === active.id);
    if (!item || getStatus(item) === newStatus) return;
    onMove(item, newStatus);
  }

  const activeItem = items.find((i) => i.id === activeId);

  return (
    <DndContext id={id} sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumnView key={col.id} column={col} count={byColumn.get(col.id)?.length ?? 0}>
            {(byColumn.get(col.id) ?? []).length === 0 ? (
              <p className="px-2 py-6 text-center text-xs" style={{ color: "var(--muted-2)" }}>
                {emptyLabel}
              </p>
            ) : (
              (byColumn.get(col.id) ?? []).map((item) => (
                <KanbanCard key={item.id} id={item.id}>
                  {renderCard(item)}
                </KanbanCard>
              ))
            )}
          </KanbanColumnView>
        ))}
      </div>
      <DragOverlay>{activeItem ? <div className="rotate-2 opacity-90">{renderCard(activeItem)}</div> : null}</DragOverlay>
    </DndContext>
  );
}

function KanbanColumnView<S extends string>({
  column,
  count,
  children,
}: {
  column: KanbanColumn<S>;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div
      ref={setNodeRef}
      className={cn("flex w-72 shrink-0 flex-col gap-2 rounded-xl border p-2.5 transition-colors")}
      style={{ borderColor: isOver ? "var(--route)" : "var(--border-subtle)", background: isOver ? "var(--route-soft)" : "var(--graphite)" }}
    >
      <div className="flex items-center justify-between px-1.5 py-1">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
          {column.color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: column.color }} />}
          {column.label}
        </span>
        <span className="text-xs" style={{ color: "var(--muted-2)", fontFamily: "var(--font-mono)" }}>
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function KanbanCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn(isDragging && "opacity-40")}>
      {children}
    </div>
  );
}
