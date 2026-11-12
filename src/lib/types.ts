export type Category = "soups" | "stews" | "rice";
export interface Pack {
  label: string;
  price: number;
}
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  packs: Pack[];
}
export interface Kitchen {
  id: string;
  name: string;
  base: string;
  type: string;
  description: string;
  image: string;
  imageAlt: string;
  categories: Category[];
  areas: string[];
  leadDays: number;
  packNote: string;
  menu: MenuItem[];
}
export interface CartLine {
  vendorId: string;
  itemId: string;
  packIndex: number;
  quantity: number;
}
export interface Plan {
  area: string;
  date: string;
  slot: string;
}
export interface QuoteLine {
  itemId: string;
  name: string;
  packIndex: number;
  pack: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}
export interface Quote {
  vendorId: string;
  vendorName: string;
  area: string;
  date: string;
  slot: string;
  slotLabel: string;
  currency: "NGN";
  items: QuoteLine[];
  foodSubtotal: number;
  deliveryFee: number;
  total: number;
  notice: string;
}
export interface TestCustomer {
  name: string;
  phone: string;
  address: string;
}
export interface TestOrder extends Quote {
  id: string;
  createdAt: string;
  status: "received";
  statusLabel: string;
  paymentStatus: "not_requested";
  customer: TestCustomer;
  testOnly: true;
  nextStep: string;
  accountId?: string | null;
}
export interface OrderAccess {
  id: string;
  key: string;
}
export interface PendingOrder {
  requestKey: string;
  key: string;
  bodyJSON: string;
}
export interface Health {
  ok: boolean;
  version: string;
  framework: string;
  mode: "local-test" | "supabase-test";
  database: string;
  today: string;
  minimumDate: string;
  maximumDate: string;
  authConfigured: boolean;
  paymentsConnected: false;
}
export interface StoredOrder {
  id: string;
  request_key: string;
  request_hash: string;
  access_hash: string;
  created_at: string;
  status: "received";
  payload: TestOrder;
  customer_id: string | null;
}

export interface AccountUser {
  id: string;
  email: string;
  name: string;
}
export interface AuthStatus {
  configured: boolean;
  user: AccountUser | null;
  reason?: string;
}
