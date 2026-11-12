import { z } from "zod";

const email = z.string().trim().email().max(254).transform(value => value.toLowerCase());

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const username = text(3, 30)
  .transform(value => value.toLowerCase())
  .refine(value => /^[a-z0-9_]{3,30}$/.test(value), {
    message: "Use 3–30 letters, numbers or underscores for the username.",
  })
  .refine(value => !["admin", "support", "staff", "system", "jie_bulk_order", "feranmi"].includes(value), {
    message: "Please choose a different username.",
  });

const phone = z.string().trim()
  .transform(value => value.replace(/[\s()-]/g, ""))
  .refine(value => /^(?:0[0-9]{10}|\+234[0-9]{10})$/.test(value), {
    message: "Use an 11-digit Nigerian-format number, or +234 followed by 10 digits.",
  })
  .transform(value => value.startsWith("0") ? `+234${value.slice(1)}` : value);

const common = {
  firstName: text(1, 60),
  email,
  phone,
  username,
  password: z.string().min(12, "Use a password of at least 12 characters.").max(128),
  acknowledged: z.literal(true, {
    error: "Confirm that you own this email and understand this is a development account.",
  }),
};

export const signupSchema = z.discriminatedUnion("vendorRequested", [
  z.object({
    ...common,
    vendorRequested: z.literal(false),
  }).strict(),
  z.object({
    ...common,
    vendorRequested: z.literal(true),
    vendorFullName: text(2, 120),
    businessName: text(2, 120),
    vendorCategory: z.enum(["restaurant", "home_food", "local_dish"]),
    publicArea: text(2, 80),
    publicAddress: text(8, 300),
    publicAddressAcknowledged: z.literal(true, {
      error: "Acknowledge that this area and address are intended for your approved public menu.",
    }),
  }).strict(),
]);

export function safeNextPath(value: unknown) {
  return typeof value === "string" &&
    ["/account", "/orders", "/checkout", "/"].includes(value)
    ? value
    : "/account";
}
