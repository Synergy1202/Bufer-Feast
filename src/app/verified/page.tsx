import Link from "next/link";
import { CheckCircle, ArrowRight, ChefHat } from "lucide-react";

export default function VerifiedPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#E7E5E4] p-10 text-center">
        
        {/* Success Icon */}
        <div className="w-24 h-24 bg-[#84CC16] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#84CC16]/20 animate-fade-in-up">
          <CheckCircle className="text-white" size={48} />
        </div>

        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#EA580C]/10 rounded-full mb-4">
          <ChefHat className="text-[#EA580C]" size={24} />
        </div>

        <h1 className="text-3xl font-bold text-[#1C1917] mb-3">Email Verified!</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Welcome to the family. Your account is now fully active and ready to go. 
          You can now access your vendor dashboard and start setting up your kitchen.
        </p>

        {/* Action Button */}
        <Link 
          href="/vendor/settings" 
          className="inline-flex items-center justify-center gap-2 w-full py-4 bg-[#1C1917] text-white font-bold rounded-xl hover:bg-[#EA580C] transition-all duration-300 shadow-lg"
        >
          Go to Vendor Dashboard <ArrowRight size={18} />
        </Link>

        <p className="text-xs text-gray-400 mt-6">
          Need help setting up? <Link href="/support" className="text-[#EA580C] font-bold hover:underline">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}