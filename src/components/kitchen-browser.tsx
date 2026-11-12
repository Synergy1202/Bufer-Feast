"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { KitchenCard } from "@/components/kitchen-card";
import { DiscoveryForm } from "@/components/discovery-form";
import { EmptyState } from "@/components/empty-state";
import { savePlan } from "@/lib/client-store";
import type { Category, Kitchen } from "@/lib/types";
import { daysBetween, shortDate, validDate } from "@/lib/format";
export function KitchenBrowser({
  kitchens,
  today,
  area,
  date,
  category,
}: {
  kitchens: Kitchen[];
  today: string;
  area: string;
  date: string;
  category: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const filtered = kitchens.filter(
    (k) =>
      (category === "all" || k.categories.includes(category as Category)) &&
      (!area ||
        (k.areas.includes(area) &&
          validDate(date) &&
          daysBetween(today, date) >= k.leadDays)),
  );
  function changeCategory(value: string) {
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (date) params.set("date", date);
    if (value !== "all") params.set("category", value);
    startTransition(() => router.replace(`/kitchens?${params}`));
  }
  return (
    <>
      <div className="results-search">
        <DiscoveryForm
          key={`${area}:${date}`}
          today={today}
          initialArea={area}
          initialDate={date}
        />
      </div>
      <div className="filter-toolbar">
        <fieldset className="filter-pills" aria-label="Food categories">
          {[
            { id: "all", label: "All food" },
            { id: "soups", label: "Soups" },
            { id: "stews", label: "Stews" },
            { id: "rice", label: "Rice & sides" },
          ].map((item) => (
            <Button
              key={item.id}
              variant={category === item.id ? "default" : "outline"}
              onClick={() => changeCategory(item.id)}
              aria-pressed={category === item.id}
              disabled={pending}
            >
              {item.label}
            </Button>
          ))}
        </fieldset>
        {(area || category !== "all") && (
          <Button
            variant="link"
            onClick={() => {
              savePlan({ area: "", date: "", slot: "" });
              router.push("/kitchens");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
      <p className="results-summary" role="status">
        {pending
          ? "Updating sample results…"
          : `${filtered.length} sample ${filtered.length === 1 ? "kitchen" : "kitchens"}${area ? ` · ${area === "Other" ? "Another Lagos area" : area} · ${shortDate(date)}` : " · Availability and prices are illustrative."}`}
      </p>
      {filtered.length ? (
        <div className="kitchen-grid">
          {filtered.map((kitchen) => (
            <KitchenCard key={kitchen.id} kitchen={kitchen} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No sample matches just yet."
          description="Try another area, food category or a later date. These are demo rules—not live kitchen schedules."
          href="/kitchens"
          label="Explore all sample kitchens"
        />
      )}
    </>
  );
}
