import { redirect } from "next/navigation";

type VerifyEmailPageProps = { searchParams: Promise<{ type?: string; email?: string }> };

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set("type", params.type === "vendor" ? "vendor" : "customer");
  if (params.email) query.set("email", params.email);
  redirect(`/check-email?${query.toString()}`);
}
