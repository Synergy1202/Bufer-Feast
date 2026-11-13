import { EmailConfirmationPending } from "@/components/email-confirmation-pending";

type CheckEmailPageProps = { searchParams: Promise<{ type?: string; email?: string }> };

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const params = await searchParams;
  const accountType = params.type === "vendor" ? "vendor" : "customer";
  const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
  return <EmailConfirmationPending email={email} accountType={accountType} />;
}
