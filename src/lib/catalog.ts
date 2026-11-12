import type { Kitchen } from "./types";

// Fictional fixtures, NOT real prices, vendor verification or operating policies.
export const kitchens: Kitchen[] = [
  {
    id: "sunday-pot",
    name: "The Sunday Pot",
    base: "Yaba",
    type: "Soups & stews",
    description: "Slow-weekend comfort, ready for your weekday table.",
    image: "/assets/soup.webp",
    imageAlt: "Illustrative bowl of egusi soup",
    categories: ["soups", "stews"],
    areas: ["Yaba", "Surulere", "Ikeja"],
    leadDays: 1,
    packNote: "2 & 5 litre packs",
    menu: [
      {
        id: "egusi",
        name: "Egusi soup",
        description: "Melon-seed soup with leafy greens. A familiar favourite.",
        packs: [
          {
            label: "2 litres",
            price: 14500,
          },
          {
            label: "5 litres",
            price: 33500,
          },
        ],
      },
      {
        id: "efo",
        name: "Efo riro",
        description: "A rich, home-style leafy vegetable soup.",
        packs: [
          {
            label: "2 litres",
            price: 13000,
          },
          {
            label: "5 litres",
            price: 30000,
          },
        ],
      },
      {
        id: "beef-stew",
        name: "Peppered beef stew",
        description: "A generous tomato stew with pieces of beef.",
        packs: [
          {
            label: "2 litres",
            price: 16000,
          },
          {
            label: "5 litres",
            price: 37500,
          },
        ],
      },
    ],
  },
  {
    id: "everyday-kitchen",
    name: "Everyday Kitchen",
    base: "Lekki",
    type: "Rice & sides",
    description: "Party-style rice. No special occasion required.",
    image: "/assets/rice.webp",
    imageAlt: "Illustrative bowl of Nigerian jollof rice",
    categories: ["rice"],
    areas: ["Lekki", "Victoria Island", "Ikeja"],
    leadDays: 1,
    packNote: "5 & 10 litre rice packs",
    menu: [
      {
        id: "jollof",
        name: "Smoky jollof rice",
        description:
          "Tomato-rich jollof rice. Protein and sides sold separately.",
        packs: [
          {
            label: "5 litres",
            price: 18500,
          },
          {
            label: "10 litres",
            price: 35000,
          },
        ],
      },
      {
        id: "plantain",
        name: "Fried plantain",
        description: "Golden, ripe plantain to share with your meal.",
        packs: [
          {
            label: "1 litre",
            price: 6500,
          },
          {
            label: "2 litres",
            price: 12000,
          },
        ],
      },
      {
        id: "chicken",
        name: "Peppered chicken",
        description: "A side of chicken pieces in a pepper sauce.",
        packs: [
          {
            label: "5 pieces",
            price: 12500,
          },
          {
            label: "10 pieces",
            price: 24000,
          },
        ],
      },
    ],
  },
  {
    id: "gather-grain",
    name: "Gather & Grain",
    base: "Ikoyi",
    type: "Stews & rice",
    description: "Something hearty for everyone around your table.",
    image: "/assets/stew.webp",
    imageAlt: "Illustrative bowl of Nigerian chicken stew",
    categories: ["stews", "rice"],
    areas: ["Ikoyi", "Victoria Island", "Lekki", "Yaba"],
    leadDays: 2,
    packNote: "2 & 5 litre packs",
    menu: [
      {
        id: "chicken-stew",
        name: "Home-style chicken stew",
        description: "Rich tomato and pepper stew with chicken pieces.",
        packs: [
          {
            label: "2 litres",
            price: 18000,
          },
          {
            label: "5 litres",
            price: 42000,
          },
        ],
      },
      {
        id: "tomato-stew",
        name: "Classic tomato stew",
        description: "A tomato and pepper base. Protein not included.",
        packs: [
          {
            label: "2 litres",
            price: 12500,
          },
          {
            label: "5 litres",
            price: 28000,
          },
        ],
      },
      {
        id: "white-rice",
        name: "Fluffy white rice",
        description: "A simple companion for your favourite stew.",
        packs: [
          {
            label: "2 litres",
            price: 6500,
          },
          {
            label: "5 litres",
            price: 14000,
          },
        ],
      },
    ],
  },
];
export const deliveryFees: Record<string, number> = {
  Yaba: 1500,
  Surulere: 1800,
  Ikeja: 2000,
  Lekki: 2500,
  "Victoria Island": 2800,
  Ikoyi: 3000,
};
export const slots = [
  { id: "lunch", label: "12–2 pm (Lagos time)" },
  { id: "evening", label: "4–6 pm (Lagos time)" },
];
export const allAreas = Object.keys(deliveryFees);
