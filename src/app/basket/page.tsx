import type { Metadata } from "next";
import { BasketView } from "@/components/basket-view";

export const metadata: Metadata = {
  title: "Your basket",
};

export default function BasketPage() {
  return <BasketView />;
}