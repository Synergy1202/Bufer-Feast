import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function VendorSignupSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-[#111111] border border-[#333333] rounded-3xl p-8 text-center">
        <CheckCircle2
          className="mx-auto text-[#84CC16]"
          size={64}
        />

        <h1 className="text-3xl font-bold text-white mt-6">
          Application Submitted
        </h1>

        <p className="text-[#a0a0a0] mt-4 leading-7">
          Your vendor application has been received. Our team will review your
          business details and verification information before approving your
          kitchen.
        </p>

        <div className="flex flex-col gap-3 mt-8">
          <Link
            href="/login"
            className="bg-[#FF5500] text-white font-bold rounded-xl py-3"
          >
            Go to Login
          </Link>

          <Link
            href="/"
            className="text-[#a0a0a0] hover:text-white py-3"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}