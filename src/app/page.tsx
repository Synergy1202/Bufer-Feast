"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { 
  ChefHat, MapPin, Star, ArrowRight, Search, 
  Truck, Heart, CheckCircle, Sparkles, Award, 
  UtensilsCrossed, Soup, Sandwich, Flame,
  Pizza, Package, Drumstick
} from "lucide-react";

export default function HomePage() {
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("role", "vendor").limit(4)
      .then(({ data }) => {
        if (data) setVendors(data);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 7 Categories with new content
  const categories = [
    { 
      name: "Party Trays & Platters", 
      icon: UtensilsCrossed, 
      desc: "Big trays for events & celebrations. Feed 10 - 100 people with zero stress.",
      featured: true 
    },
    { 
      name: "Swallows & Soups", 
      icon: Soup, 
      desc: "Naija classics. Poundo, Amala, Eba served with Egusi, Ogbono, Banga, Vegetable & more." 
    },
    { 
      name: "Rice Dishes", 
      icon: Flame, 
      desc: "Party Jollof, Fried Rice, Coconut Rice & White Rice. Cooked fresh and ready to add proteins." 
    },
    { 
      name: "Pasta & Noodles", 
      icon: Sandwich, 
      desc: "Spaghetti, Macaroni, Stir-fry & Indomie. Comfort food for 1 person or in bulk." 
    },
    { 
      name: "Continental Dishes", 
      icon: Pizza, 
      desc: "International favorites. Burgers, Pizza, Pasta Alfredo, Grilled Chicken & Chips, Shawarma & more." 
    },
    { 
      name: "Bulk Meal Packs", 
      icon: Package, 
      desc: "Individual portions in bulk. Order 10, 20, 50 packs. Perfect for individuals, hostels & offices." 
    },
    { 
      name: "Sides, Proteins & Extras", 
      icon: Drumstick, 
      desc: "Complete your meal. Grilled Chicken, Fish, Beef, Plantain, Coleslaw, Sauces & Add-ons." 
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden">
      
      {/*  1. HERO SECTION (Matching Green Picture Layout) ðŸŒŸ */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center z-10">
        
        {/* Background Design Element (The Orange Stripe) */}
        <div className="absolute top-0 right-[10%] w-24 h-full bg-gradient-to-b from-[#FF5500] to-[#CC4400] opacity-20 blur-3xl -z-10"></div>
        <div className="absolute top-0 left-[15%] w-px h-full bg-[#333] -z-10"></div>
        <div className="absolute top-0 right-[20%] w-px h-full bg-[#333] -z-10"></div>

        {/* Business Name Badge */}
        <div className="mb-6 text-4xl font-black uppercase tracking-[0.18em] text-[#FF5500] sm:text-5xl md:text-6xl">
  Bufer Feast
</div>

        {/* New Badge */}
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] border border-[#333] rounded-full text-[#FF5500] text-lg font-bold mb-8 animate-fade-in-up">
          <Sparkles size={20} />
          ORDER BIG, EAT BETTER
        </div>
        
        {/* Main Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight mb-6 max-w-4xl">
          Taste the <span className="text-[#FF5500] italic font-serif">Culture.</span>
        </h1>
        
        {/* Introductory message */}
        <p className="text-xl text-[#a0a0a0] max-w-2xl leading-relaxed mb-10">
          Be among our first customers enjoying authentic, home-style meals delivered to their door.
        </p>

        {/* Search Bar */}
        <div className="w-full max-w-2xl relative group mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5500] to-[#CC4400] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center bg-[#111111] rounded-xl border border-[#333] p-2 shadow-2xl">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] rounded-lg text-white">
              <MapPin className="text-[#FF5500] shrink-0" size={20} />
              <input type="text" placeholder="Delivery address..." className="w-full outline-none bg-transparent placeholder-[#777]" />
            </div>
            <Link href="/kitchens" className="bg-[#FF5500] hover:bg-[#e64d00] text-white font-bold py-3 px-8 rounded-lg transition-all flex items-center justify-center gap-2 ml-2">
              Find Food <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Trust Badges (Using text from your "Why Choose Us" section) */}
        <div className="flex flex-wrap justify-center gap-8 text-sm text-[#a0a0a0] font-medium">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-[#FF5500]" /> Trusted Kitchens
          </div>
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-[#FF5500]" /> Made with Love
          </div>
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-[#FF5500]" /> Bulk Delivery
          </div>
        </div>
      </section>

      {/* ðŸŒŸ 2. CATEGORIES SECTION ðŸŒŸ */}
      <section className="py-24 px-4 bg-[#0f0f0f] border-t border-[#222]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">Explore Categories</h2>
              <p className="text-[#a0a0a0] text-lg">Find exactly what your event needs</p>
            </div>
            <Link href="/kitchens" className="hidden md:flex items-center gap-2 text-white font-bold hover:text-[#FF5500] transition-colors group">
              View All <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* BENTO GRID - 7 Categories */}
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4">
            
            {/* Featured: Party Trays (Spans 2 cols, 2 rows) */}
            <Link href="/kitchens" className="md:col-span-2 md:row-span-2 group relative bg-[#111111] border border-[#333] rounded-[2rem] p-8 overflow-hidden flex flex-col justify-between hover:border-[#FF5500] transition-all duration-500 min-h-[300px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5500] rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative z-10">
                <UtensilsCrossed className="text-[#FF5500] mb-4" size={48} />
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">Party Trays & Platters</h3>
                <p className="text-[#a0a0a0] text-lg">Big trays for events & celebrations. Feed 10 - 100 people with zero stress.</p>
              </div>
              <div className="relative z-10 flex items-center gap-2 text-[#FF5500] font-bold text-lg mt-6">
                Browse Platters <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>

            {/* Swallows & Soups */}
            <Link href="/kitchens" className="md:col-span-1 md:row-span-1 group relative bg-[#FF5500] rounded-[2rem] p-6 flex flex-col justify-between hover:bg-[#e64d00] transition-colors duration-300 text-white min-h-[180px]">
              <Soup size={36} />
              <div>
                <h3 className="text-xl font-bold mb-1">Swallows & Soups</h3>
                <p className="text-xs text-white/80">Naija classics. Poundo, Amala, Eba served with Egusi, Ogbono, Banga, Vegetable & more.</p>
              </div>
            </Link>

            {/* Rice Dishes */}
            <Link href="/kitchens" className="md:col-span-1 md:row-span-1 group relative bg-[#1a1a1a] border border-[#333] rounded-[2rem] p-6 flex flex-col justify-between hover:border-[#FF5500] transition-all duration-300 text-white min-h-[180px]">
              <Flame size={36} className="text-[#FF5500]" />
              <div>
                <h3 className="text-xl font-bold mb-1">Rice Dishes</h3>
                <p className="text-xs text-[#a0a0a0]">Party Jollof, Fried Rice, Coconut Rice & White Rice. Cooked fresh and ready to add proteins.</p>
              </div>
            </Link>

            {/* Pasta & Noodles */}
            <Link href="/kitchens" className="md:col-span-1 md:row-span-1 group relative bg-[#1a1a1a] border border-[#333] rounded-[2rem] p-6 flex flex-col justify-between hover:border-[#FF5500] transition-all duration-300 text-white min-h-[180px]">
              <Sandwich className="text-[#FF5500]" size={36} />
              <div>
                <h3 className="text-xl font-bold mb-1">Pasta & Noodles</h3>
                <p className="text-xs text-[#a0a0a0]">Spaghetti, Macaroni, Stir-fry & Indomie. Comfort food for 1 person or in bulk.</p>
              </div>
            </Link>

            {/* Continental Dishes */}
            <Link href="/kitchens" className="md:col-span-1 md:row-span-1 group relative bg-[#1a1a1a] border border-[#333] rounded-[2rem] p-6 flex flex-col justify-between hover:border-[#FF5500] transition-all duration-300 text-white min-h-[180px]">
              <Pizza className="text-[#FF5500]" size={36} />
              <div>
                <h3 className="text-xl font-bold mb-1">Continental Dishes</h3>
                <p className="text-xs text-[#a0a0a0]">International favorites. Burgers, Pizza, Pasta Alfredo, Grilled Chicken & Chips, Shawarma & more.</p>
              </div>
            </Link>

            {/* Bulk Meal Packs (Spans 2 cols) */}
            <Link href="/kitchens" className="md:col-span-2 md:row-span-1 group relative bg-[#1a1a1a] border border-[#333] rounded-[2rem] p-6 flex items-center gap-6 hover:border-[#FF5500] transition-all duration-300 text-white min-h-[140px]">
              <div className="w-16 h-16 bg-[#FF5500] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Package className="text-white" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Bulk Meal Packs</h3>
                <p className="text-sm text-[#a0a0a0]">Individual portions in bulk. Order 10, 20, 50 packs. Perfect for individuals, hostels & offices.</p>
              </div>
            </Link>

            {/* Sides, Proteins & Extras */}
            <Link href="/kitchens" className="md:col-span-2 md:row-span-1 group relative bg-[#1a1a1a] border border-[#333] rounded-[2rem] p-6 flex items-center gap-6 hover:border-[#FF5500] transition-all duration-300 text-white min-h-[140px]">
              <div className="w-16 h-16 bg-[#FF5500] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Drumstick className="text-white" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Sides, Proteins & Extras</h3>
                <p className="text-sm text-[#a0a0a0]">Complete your meal. Grilled Chicken, Fish, Beef, Plantain, Coleslaw, Sauces & Add-ons.</p>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ðŸŒŸ 3. FEATURED KITCHENS ðŸŒŸ */}
      <section className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">Featured Kitchens</h2>
              <p className="text-[#a0a0a0] text-lg">Meet the talented cooks behind your meals</p>
            </div>
            <Link href="/kitchens" className="hidden md:flex items-center gap-2 text-white font-bold hover:text-[#FF5500] transition-colors group">
              View All <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vendors.map((vendor) => (
              <Link href={`/kitchens/${vendor.id}`} key={vendor.id} className="group bg-[#111111] rounded-[2rem] overflow-hidden border border-[#333] hover:border-[#FF5500] hover:-translate-y-2 transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ChefHat className="text-white/10 group-hover:text-[#FF5500]/40 group-hover:scale-110 transition-all duration-500" size={80} />
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 bg-[#111111]/90 backdrop-blur-sm border border-[#333] rounded-full text-xs font-bold text-white flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#FF5500] rounded-full animate-pulse"></span> Open Now
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-white text-xl mb-2 group-hover:text-[#FF5500] transition-colors line-clamp-1">
                    {vendor.business_name || vendor.full_name || "Local Kitchen"}
                  </h3>
                  <div className="flex items-center gap-1 mb-4">
                    <Star size={14} className="text-[#FF5500] fill-[#FF5500]" />
                    <span className="text-sm font-bold text-white">4.9</span>
                    <span className="text-xs text-[#a0a0a0] ml-1">â€¢ {vendor.location || "Lagos"}</span>
                  </div>
                  <div className="text-xs text-white font-bold bg-[#FF5500]/20 text-[#FF5500] inline-block px-3 py-1 rounded-full">
                    {vendor.vendor_type || "Home Kitchen"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ðŸŒŸ 4. WHY CHOOSE US (Matching "How It Works" Layout) ðŸŒŸ */}
      <section className="py-24 px-4 bg-[#0f0f0f] border-t border-[#222]">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Choose Bufer Feast?</h2>
            <p className="text-[#a0a0a0] max-w-2xl mx-auto text-lg">We're not just another food app. We're a movement.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, title: "Trusted Kitchens", desc: "Every cook is reviewed before joining Bufer Feast." },
              { icon: Heart, title: "Made with Love", desc: "Authentic home-style cooking you can taste" },
              { icon: Truck, title: "Bulk Delivery", desc: "Perfectly scaled for events, offices, and families" },
              { icon: CheckCircle, title: "Quality Guaranteed", desc: "Fresh ingredients, prepared daily with care" }
            ].map((feature, idx) => (
              <div key={idx} className="bg-[#111111] border border-[#333] p-8 rounded-[2rem] hover:border-[#FF5500] transition-all duration-300 group">
                <feature.icon className="text-[#FF5500] mb-6 group-hover:scale-110 transition-all duration-300" size={40} />
                <h3 className="font-bold text-xl mb-3 text-white">{feature.title}</h3>
                <p className="text-sm text-[#a0a0a0] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ðŸŒŸ 5. CTA SECTION ðŸŒŸ */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto text-center bg-[#111111] border border-[#333] rounded-[3rem] p-12 md:p-24 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF5500] rounded-full blur-[120px] opacity-20 animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF5500] rounded-full blur-[120px] opacity-10 animate-float" style={{ animationDelay: '3s' }}></div>
          
          <div className="relative z-10">
            <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">Ready to Order?</h2>
            <p className="text-xl md:text-2xl text-[#a0a0a0] mb-12 max-w-2xl mx-auto">Join thousands of happy customers enjoying authentic, home-style meals delivered to their door.</p>
            <Link href="/kitchens" className="inline-flex items-center gap-3 px-12 py-6 bg-[#FF5500] text-white font-bold rounded-2xl hover:bg-[#e64d00] hover:scale-105 active:scale-95 transition-all duration-300 text-xl shadow-xl shadow-[#FF5500]/20">
              Browse Kitchens <ArrowRight size={24} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
