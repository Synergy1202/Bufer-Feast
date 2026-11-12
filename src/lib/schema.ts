import { z } from "zod";
const cleanText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine(
      (value) =>
        Array.from(value).every((char) => {
          const code = char.codePointAt(0) ?? 0;
          return code >= 32 && code !== 127;
        }),
      "Control characters are not allowed.",
    );
export const lineSchema = z.object({
  vendorId: z.string().optional(),
  itemId: z.string(),
  packIndex: z.number().int().nonnegative(),
  quantity: z.number().int().min(1).max(99),
});
export const quoteSchema = z.object({
  vendorId: z.string(),
  items: z.array(lineSchema).min(1).max(30),
  area: z.string().min(1, "Choose an area."),
  date: z.string(),
  slot: z.string().min(1, "Choose a time window."),
});
export const customerSchema = z.object({
  name: cleanText(2, 80),
  phone: cleanText(11, 20)
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .refine(
      (value) => /^(?:0\d{10}|\+234\d{10})$/.test(value),
      "Use a Nigerian-format test number, such as 08000000000.",
    ),
  address: cleanText(8, 200),
});
export const orderSchema = quoteSchema.extend({
  customer: customerSchema,
  testAcknowledged: z.literal(true, {
    error: "Acknowledge that you are using fictional details for a test order.",
  }),
  expectedTotal: z.number().int().nonnegative(),
  accountCheckout: z.boolean().optional().default(false),
  accountUserId: z.string().uuid().nullable().optional(),
});
