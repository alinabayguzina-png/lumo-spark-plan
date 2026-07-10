import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyPlans, deletePlan } from "@/lib/plans.functions";
import { Button } from "@/components/ui/button";
import { Trash2, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — Lumo AI" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const listFn = useServerFn(listMyPlans);
  const delFn = useServerFn(deletePlan);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["plans"], queryFn: () => listFn() });

  async function remove(id: string) {
    if (!confirm("Delete this plan? This cannot be undone.")) return;
    try {
      await delFn({ data: { id } });
      toast.success("Plan deleted.");
      qc.invalidateQueries({ queryKey: ["plans"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-primary">Archive</div>
          <h1 className="mt-1 text-display text-4xl font-semibold">Your plans</h1>
        </div>
        <Button asChild>
          <Link to="/generate">New plan</Link>
        </Button>
      </div>

      {!data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <HistoryIcon className="mx-auto mb-3 h-6 w-6" />
          Nothing here yet. Generate your first plan.
        </div>
      ) : (
        <ul className="grid gap-3">
          {data.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <Link to="/plan/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                <div className="font-display text-lg">{p.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  {p.month ? ` · ${p.month}` : ""}
                </div>
              </Link>
              <button
                onClick={() => remove(p.id)}
                className="ml-4 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}