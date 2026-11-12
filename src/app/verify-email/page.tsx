import { EmailOtpVerification } from "@/components/email-otp-verification";

type VerifyEmailPageProps = {
  searchParams: Promise<{ type?: string; email?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const type = params.type === "vendor" ? "vendor" : "customer";
  const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
  return <EmailOtpVerification email={email} accountType={type} />;
}
