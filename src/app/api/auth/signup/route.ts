import { authClient, safeAuthFailure } from "@/lib/server/auth";
import { authRateLimit } from "@/lib/server/auth-rate";
import { AuthProblem } from "@/lib/server/problems";
import { apiError, guard, readJson, reply } from "@/lib/server/http";
import { z } from "zod";

export const runtime = "nodejs";

// Validation for Customer
const customerSchema = z.object({
  role: z.literal("customer"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Validation for Vendor
const vendorSchema = z.object({
  role: z.literal("vendor"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().min(2, "Business name is required"),
  vendorType: z.enum(["restaurant", "home_food", "local_dish"]),
  location: z.string().min(2, "Location is required"),
  nin: z.string().min(11, "NIN must be 11 digits").max(11),
  idProofType: z.enum(["nin", "drivers_license", "passport"]),
  cacDocument: z.string().optional(), // We save the filename for now
  ninDocument: z.string().optional(), // We save the filename for now
});

export async function POST(request: Request) {
  try {
    guard(request);
    authRateLimit(request, "signup");

    const { body } = await readJson(request);

    // 1. Validate based on the role
    let parsedData: any;
    if (typeof body === "object" && body !== null && "role" in body && body.role === "vendor") {
      const parsed = vendorSchema.safeParse(body);
      if (!parsed.success) throw new AuthProblem(parsed.error.issues[0].message, 400, "AUTH_INVALID_INPUT");
      parsedData = parsed.data;
    } else {
      const parsed = customerSchema.safeParse(body);
      if (!parsed.success) throw new AuthProblem(parsed.error.issues[0].message, 400, "AUTH_INVALID_INPUT");
      parsedData = parsed.data;
    }

    const client = await authClient();

    // 2. Prepare metadata to save alongside the user
    const metadata: any = {
      full_name: parsedData.role === "vendor" ? parsedData.fullName : `${parsedData.firstName} ${parsedData.lastName}`,
      role: parsedData.role,
    };

    // Add vendor-specific details to metadata
    if (parsedData.role === "vendor") {
      metadata.vendor_details = {
        business_name: parsedData.businessName,
        vendor_type: parsedData.vendorType,
        location: parsedData.location,
        nin: parsedData.nin,
        id_proof_type: parsedData.idProofType,
        cac_document_filename: parsedData.cacDocument,
        nin_document_filename: parsedData.ninDocument,
        status: "pending_verification", // Admins will need to approve them later
      };
    } else {
      metadata.phone = parsedData.phone;
    }

    // 3. Create the user in Supabase Auth
    const { data, error } = await client.auth.signUp({
      email: parsedData.email,
      password: parsedData.password,
      options: {
        data: metadata,
      },
    });

    if (error) throw safeAuthFailure(error, "signup");

    // 4. Return success. 
    // Note: If email confirmation is ON in Supabase, the user won't be able to login 
    // until they click the link in their email.
    return reply({ 
      ok: true, 
      message: "Account created! Please check your email to confirm your account." 
    });

  } catch (error) {
    return apiError(error);
  }
}