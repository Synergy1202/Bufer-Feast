import { authClient } from "@/lib/server/auth";
import { apiError, guard, reply } from "@/lib/server/http";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guard(request);
    
    // Verify user is logged in before allowing upload
    const client = await authClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string; // 'cac' or 'nin'

    if (!file) throw new Error("No file provided");

    // Initialize admin client for storage upload
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Requires service role key in .env.local
    );

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${folder}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("vendor-documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("vendor-documents")
      .getPublicUrl(filePath);

    return reply({ url: publicUrl });
  } catch (error) {
    return apiError(error);
  }
}