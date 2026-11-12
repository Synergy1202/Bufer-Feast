import Link from "next/link";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { submitSupportRequest } from "./actions";
import { sessionStatus } from "@/lib/server/auth";

export default async function SupportPage() {
  let userEmail = "";
  
  // Safely check if user is logged in to pre-fill their email
  try {
    const status = await sessionStatus();
    userEmail = status?.user?.email || "";
  } catch (error) {
    // If auth check fails, we just leave the email blank for them to fill manually
    console.error("Auth check failed on support page:", error);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 text-white">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-[#a0a0a0] hover:text-[#FF5500] mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Home
        </Link>

        <div className="bg-[#111111] rounded-2xl border border-[#333333] shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#FF5500] rounded-full mb-4">
              <MessageCircle size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Contact Support</h1>
            <p className="text-[#a0a0a0] text-sm">
              Have a complaint, question, or need to update your business details? 
              Our admin team will get back to you shortly.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm font-bold">
              <a
                href="https://wa.me/2349131246555"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-[#25D366] px-4 py-3 text-black"
              >
                WhatsApp us · +234 913 124 6555
              </a>
              <a
                href="mailto:buferfeast@gmail.com"
                className="rounded-lg border border-[#555] px-4 py-3 text-white"
              >
                Email support
              </a>
            </div>
          </div>

          <form action={submitSupportRequest} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#a0a0a0] uppercase">Your Email</label>
              <input 
                name="email" 
                type="email" 
                required 
                defaultValue={userEmail}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] focus:border-transparent outline-none text-white placeholder-[#666]" 
                placeholder="you@example.com" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#a0a0a0] uppercase">Subject</label>
              <select name="subject" required className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] focus:border-transparent outline-none text-white">
                <option value="" className="bg-[#0a0a0a]">Select a topic...</option>
                <option value="Business Name Change" className="bg-[#0a0a0a]">Request Business Name Change</option>
                <option value="Account Issue" className="bg-[#0a0a0a]">Account / Login Issue</option>
                <option value="Order Complaint" className="bg-[#0a0a0a]">Order Complaint</option>
                <option value="Feature Request" className="bg-[#0a0a0a]">Feature Request</option>
                <option value="Other" className="bg-[#0a0a0a]">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#a0a0a0] uppercase">Message</label>
              <textarea 
                name="message" 
                required 
                rows={5} 
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] focus:border-transparent outline-none resize-none text-white placeholder-[#666]" 
                placeholder="Please describe your issue or request in detail..."
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#FF5500] text-white font-bold rounded-xl hover:bg-[#e64d00] transition-all duration-300 shadow-lg shadow-[#FF5500]/20"
            >
              <Send size={18} /> Submit Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}