"use server";

import { redirect } from "next/navigation";
import { adminClient } from "@/lib/server/admin";

export async function submitSupportRequest(formData: FormData) {
  const email = String(formData.get("email") || "").trim().slice(0, 160);
  const subject = String(formData.get("subject") || "").trim().slice(0, 120);
  const message = String(formData.get("message") || "").trim().slice(0, 4000);

  if (!email || !email.includes("@") || !subject || !message) {
    throw new Error("Email, subject, and message are required.");
  }

  const { error } = await adminClient().from("support_requests").insert({
    email,
    subject,
    message,
    status: "open",
  });

  if (error) {
    console.error("Support request error:", error.message);
    throw new Error("Failed to submit support request. Please try again.");
  }

  redirect("/?message=Support request submitted successfully! We will contact you soon.");
}
