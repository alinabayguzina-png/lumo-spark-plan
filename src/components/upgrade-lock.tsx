import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpgradeLock({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 " + (className ?? "")
      }
    >
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg text-foreground">{title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/pricing">Switch Plan</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}