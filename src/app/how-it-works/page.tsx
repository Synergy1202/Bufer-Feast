import Link from "next/link";
import { Search, Sliders, Truck } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">How JIE_Bulk_order Works</h1>
        <p className="text-xl text-gray-600">Generous portions of home-style food, delivered to your doorstep.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Step 1 */}
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="text-green-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">1. Browse Local Kitchens</h3>
          <p className="text-gray-600">Explore menus from verified home cooks and local vendors offering bulk, family-style meals.</p>
        </div>

        {/* Step 2 */}
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sliders className="text-green-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">2. Customize Your Order</h3>
          <p className="text-gray-600">Use our smart calculator to scale portions exactly for your headcount, whether it's 5 people or 50.</p>
        </div>

        {/* Step 3 */}
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="text-green-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">3. Enjoy Home-Style Food</h3>
          <p className="text-gray-600">We handle the logistics. Fresh, hot meals arrive at your scheduled time, ready to serve.</p>
        </div>
      </div>

      <div className="text-center mt-16">
        <Link href="/" className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">
          Start Ordering
        </Link>
      </div>
    </div>
  );
}