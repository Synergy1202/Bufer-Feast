import { money } from "@/lib/format";
import type { QuoteLine } from "@/lib/types";
export function QuoteLines({ items }: { items: QuoteLine[] }) {
  return (
    <div className="quote-lines">
      {items.map((item) => (
        <div className="quote-line" key={`${item.itemId}:${item.packIndex}`}>
          <div>
            <strong>{item.name}</strong>
            <span>
              {item.quantity} × {item.pack} · {money(item.unitPrice)} each
            </span>
          </div>
          <b>{money(item.lineTotal)}</b>
        </div>
      ))}
    </div>
  );
}
export function QuoteTotals({
  food,
  delivery,
  total,
  label = "Test total",
}: {
  food: number;
  delivery?: number;
  total?: number;
  label?: string;
}) {
  return (
    <div className="quote-totals">
      <div>
        <span>Food subtotal</span>
        <strong>{money(food)}</strong>
      </div>
      <div>
        <span>Demo delivery fee</span>
        <span>
          {delivery === undefined ? "Not calculated" : money(delivery)}
        </span>
      </div>
      <div className="quote-total">
        <span>{label}</span>
        <strong data-testid="quote-total">
          {total === undefined ? "—" : money(total)}
        </strong>
      </div>
    </div>
  );
}
