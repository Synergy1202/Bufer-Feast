import { authClient, safeAuthFailure } from "@/lib/server/auth";
import { apiError, guard, readJson, reply } from "@/lib/server/http";
import { AuthProblem } from "@/lib/server/problems";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guard(request);

    const { body } = await readJson(request) as {
      body: {
        email?: string;
        password?: string;
        businessName?: string;
        [key: string]: unknown;
      };
    };
    
    // Basic validation
    if (!body.email || !body.password || !body.businessName) {
      throw new AuthProblem("Missing required business or account details.", 400, "AUTH_INVALID_INPUT");
    }

    const client = await authClient();

    // Create the user in Supabase Auth
    const { data, error } = await client.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          // Mark them as a vendor
          role: "vendor",
          full_name: body.fullName,
          
          // Save all the BRD Vendor Onboarding details to metadata
          vendor_details: {
            business_name: body.businessName,
            vendor_type: body.vendorType,
            location: body.location,
            hours: {
              open: body.openTime,
              close: body.closeTime,
            },
            legal: {
              bvn: body.bvn,
              nin: body.nin,
              id_proof_type: body.idProofType,
            },
            bank: {
              bank_name: body.bankName,
              account_number: body.accountNumber,
            },
            financials: {
              commission_structure: body.commissionStructure,
            },
            documents: {
              cac_ref: body.cacDocRef,
              food_safety_ref: body.foodSafetyCertRef,
              kitchen_inspection_ref: body.kitchenInspectionRef,
            },
            status: "pending_verification" // Admins will need to approve this later
          }
        },
      },
    });

    if (error) throw safeAuthFailure(error, "signup");

    // Since we are ignoring email verification for testing, we can just return success
    return reply({ 
      ok: true, 
      message: "Vendor application submitted successfully." 
    });

  } catch (error) {
    return apiError(error);
  }
}