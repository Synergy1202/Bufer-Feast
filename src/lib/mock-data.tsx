export const mockVendors = [
  {
    id: "v1",
    name: "Mama Put Delights",
    type: "local_dish",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
    cutOffTime: "10:00 AM",
  },
  {
    id: "v2",
    name: "Lagos Corporate Catering",
    type: "restaurant",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    cutOffTime: "8:00 AM",
  },
];

export const mockMenus = [
  {
    id: "m1",
    vendorId: "v1",
    vendorName: "Mama Put Delights",
    title: "Weekend Jollof & Chicken Platter",
    description: "Smoky party-style jollof rice served with grilled chicken, plantain, and coleslaw.",
    baseServings: 5,
    pricePerServing: 4500,
    category: "Party Platter",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "m2",
    vendorId: "v1",
    vendorName: "Mama Put Delights",
    title: "Egusi & Pounded Yam Bulk Pack",
    description: "Rich egusi soup with assorted meats, served with smooth pounded yam.",
    baseServings: 4,
    pricePerServing: 5500,
    category: "Home Meal",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "m3",
    vendorId: "v2",
    vendorName: "Lagos Corporate Catering",
    title: "Executive Lunch Box (Rice & Fish)",
    description: "Fried rice, grilled tilapia, and fresh salad. Perfect for office lunches.",
    baseServings: 10,
    pricePerServing: 6000,
    category: "Office",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  },
];