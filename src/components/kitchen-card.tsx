import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Kitchen } from "@/lib/types";
import { money } from "@/lib/format";
export function KitchenCard({ kitchen }: { kitchen: Kitchen }) {
  const cheapest = Math.min(
    ...kitchen.menu.flatMap((item) => item.packs.map((pack) => pack.price)),
  );
  return (
    <Card
      className="kitchen-card overflow-hidden gap-0 py-0"
      data-testid={`kitchen-${kitchen.id}`}
    >
      <div className="kitchen-photo">
        <Image
          src={kitchen.image}
          alt={kitchen.imageAlt}
          fill
          sizes="(max-width: 700px) 90vw, (max-width: 1000px) 45vw, 360px"
        />
        <span className="sample-tag">SAMPLE KITCHEN</span>
        <span className="kitchen-kind">{kitchen.type}</span>
      </div>
      <div className="kitchen-body">
        <p className="kitchen-location">
          <MapPin size={13} aria-hidden="true" />
          {kitchen.base}, Lagos
        </p>
        <h3>{kitchen.name}</h3>
        <p className="kitchen-description">{kitchen.description}</p>
        <p className="kitchen-pack">
          <Utensils size={14} aria-hidden="true" />
          {kitchen.packNote}
        </p>
        <div className="kitchen-bottom">
          <div>
            <strong>From {money(cheapest)}</strong>
            <small>per pack · demo pricing</small>
          </div>
          <Link
            href={`/kitchens/${kitchen.id}`}
            className="menu-link"
            aria-label={`View sample menu for ${kitchen.name}`}
          >
            View menu <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
