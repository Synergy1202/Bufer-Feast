import { createClient } from "@supabase/supabase-js";
import { KitchenList } from "./KitchenList";

export const dynamic = "force-dynamic";

export default async function KitchensPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: vendors, error } = await supabase
    .from("public_vendor_profiles")
    .select(
      "id, display_name, vendor_type, location, is_open",
    )
    .order("display_name", { ascending: true });

  if (error) {
    console.error("Error fetching kitchens:", error.message);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="bg-[#111111] border-b border-[#333333] py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FF5500] rounded-full blur-[150px] opacity-20" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 tracking-tight text-white">
            Our Partner Kitchens
          </h1>

          <p className="text-[#FF5500] text-lg font-medium">
            Authentic flavors. Local chefs. Delivered to your door.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <KitchenList kitchens={vendors ?? []} />
      </div>
    </div>
  );
}