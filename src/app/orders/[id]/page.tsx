import type { Metadata } from "next";
import { OrderView } from "@/components/order-view";
import OrderReviewForm from "@/components/OrderReviewForm";
export const metadata: Metadata = {
  title: "Order details",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OrderView id={id} />;
}