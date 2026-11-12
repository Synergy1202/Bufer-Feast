import { redirect } from "next/navigation";

type CheckEmailPageProps = {
  searchParams: Promise<{ type?: string; email?: string }>;
};

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.type === "vendor" || params.type === "customer") query.set("type", params.type);
  if (params.email) query.set("email", params.email);
  redirect(`/verify-email?${query.toString()}`);
}
