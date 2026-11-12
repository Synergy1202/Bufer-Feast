"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allAreas } from "@/lib/catalog";
import { savePlan } from "@/lib/client-store";
import { shiftDay, validDate } from "@/lib/format";
export function DiscoveryForm({
  today,
  initialArea = "",
  initialDate = "",
}: {
  today: string;
  initialArea?: string;
  initialDate?: string;
}) {
  const router = useRouter();
  const [area, setArea] = useState(initialArea),
    [date, setDate] = useState(initialDate || shiftDay(today, 1)),
    [error, setError] = useState("");
  const go = () => {
    if (!area) {
      setError("Choose a delivery area first.");
      return;
    }
    if (
      !validDate(date) ||
      date < shiftDay(today, 1) ||
      date > shiftDay(today, 30)
    ) {
      setError("Choose a date from tomorrow to 30 days ahead.");
      return;
    }
    savePlan({ area, date, slot: "" });
    router.push(`/kitchens?${new URLSearchParams({ area, date })}`);
  };
  return (
    <form
      className="discovery-form"
      onSubmit={(event) => {
        event.preventDefault();
        go();
      }}
      noValidate
    >
      <div className="discovery-fields">
        <div>
          <label htmlFor="discovery-area">
            <MapPin size={12} aria-hidden="true" />
            Delivering to
          </label>
          <select
            id="discovery-area"
            value={area}
            onChange={(event) => {
              setArea(event.target.value);
              setError("");
            }}
            aria-describedby="discovery-error"
          >
            <option value="">Choose area</option>
            {allAreas.map((option) => (
              <option key={option}>{option}</option>
            ))}
            <option value="Other">Another Lagos area</option>
          </select>
        </div>
        <div>
          <label htmlFor="discovery-date">
            <CalendarDays size={12} aria-hidden="true" />
            Preferred date
          </label>
          <input
            id="discovery-date"
            type="date"
            value={date}
            min={shiftDay(today, 1)}
            max={shiftDay(today, 30)}
            onChange={(event) => {
              setDate(event.target.value);
              setError("");
            }}
            aria-describedby="discovery-error"
          />
        </div>
      </div>
      <Button type="button" className="find-food-button" onClick={go}>
        Find my food <ArrowRight aria-hidden="true" />
      </Button>
      <p
        id="discovery-error"
        role="alert"
        className="field-error"
        hidden={!error}
      >
        {error}
      </p>
    </form>
  );
}
