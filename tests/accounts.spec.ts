import {test,expect,type Page} from "@playwright/test";
// UI coverage uses intercepted API responses only. It does not create real Auth
// users or send email. Server authorization/SDK-cookie behaviour is checked in
// scripts/security-check.cjs; your own Supabase delivery/login still needs testing.
const alice={id:"11111111-1111-4111-8111-111111111111",email:"alice@example.invalid",name:"Alice Test"};
async function mockSession(page:Page){const state:{user:typeof alice|null}={user:null};await page.route("**/api/auth/session",route=>route.fulfill({contentType:"application/json",body:JSON.stringify({configured:true,user:state.user})}));return state;}

test("unconfigured authentication stays unavailable instead of faking a login",async({page})=>{await page.goto("/login");await expect(page.getByText("Account setup is not ready here yet.")).toBeVisible();await expect(page.locator("#auth-password")).toHaveCount(0);});

test("signup validates inputs, sends a request and shows honest confirmation guidance",async({page})=>{
 await mockSession(page);let count=0;
 await page.route("**/api/auth/signup",async route=>{count++;const data=route.request().postDataJSON();expect(data.email).toBe(alice.email);expect(data.password).toBe("A_unique_test_password_123");expect(data.acknowledged).toBe(true);await route.fulfill({contentType:"application/json",body:JSON.stringify({ok:true,confirmationRequired:true,message:"If this address can register, check its inbox for the confirmation link."})});});
 await page.goto("/signup");await page.locator("#signup-name").fill(alice.name);await page.locator("#auth-email").fill(alice.email);await page.locator("#auth-password").fill("short");await page.locator("#auth-confirm-password").fill("short");await page.getByRole("button",{name:"Create test account"}).click();await expect(page.locator(".auth-panel [role=alert]")).toBeVisible();expect(count).toBe(0);
 await page.locator("#auth-password").fill("A_unique_test_password_123");await page.locator("#auth-confirm-password").fill("A_unique_test_password_123");await page.getByRole("checkbox").check();await page.getByRole("button",{name:"Create test account"}).click();await expect(page.getByRole("heading",{name:"Check your email"})).toBeVisible();expect(count).toBe(1);await expect(page.locator("#auth-password")).toHaveCount(0);
});

test("email link GET does not consume the token; explicit confirmation POST is required",async({page,context})=>{
 const session=await mockSession(page);let confirmations=0;
 await page.route("**/api/auth/confirm",async route=>{confirmations++;session.user=alice;await route.fulfill({contentType:"application/json",body:JSON.stringify({ok:true})});});
 await page.goto(`/auth/confirm?token_hash=${"a".repeat(64)}&type=email`);await expect(page).toHaveURL(/\/confirm-email$/);expect(confirmations).toBe(0);
 const cookies=await context.cookies();const cookie=cookies.find(value=>value.name==="jie_bulk_order-pending-confirmation");expect(cookie?.httpOnly).toBe(true);expect(cookie?.sameSite).toBe("Lax");expect(await page.evaluate(()=>document.cookie)).not.toContain("jie_bulk_order-pending-confirmation");
 await page.getByRole("button",{name:"Confirm email and sign in"}).click();await expect(page).toHaveURL(/\/account$/);await expect(page.locator(".account-summary")).toContainText(alice.email);expect(confirmations).toBe(1);
});

test("login/logout updates the account view and rejects external next URLs",async({page})=>{
 const session=await mockSession(page);const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 await page.route("**/api/auth/login",async route=>{session.user=alice;await route.fulfill({contentType:"application/json",body:'{"ok":true}'});});
 await page.route("**/api/auth/logout",async route=>{session.user=null;await route.fulfill({contentType:"application/json",body:'{"ok":true,"remoteRevocationConfirmed":true}'});});
 await page.goto("/login?next=https://not-this-app.example");await page.locator("#auth-email").fill(alice.email);await page.locator("#auth-password").fill("A_unique_test_password_123");await page.getByRole("button",{name:"Log in",exact:true}).click();await expect(page).toHaveURL(/\/account$/);await expect(page.locator(".account-summary")).toContainText(alice.email);
 await page.getByRole("button",{name:"Sign out of this browser"}).click();await expect(page).toHaveURL(/\/login/);await expect(page.locator("#auth-password")).toBeVisible();await expect(page.locator(".account-summary")).toHaveCount(0);expect(errors).toEqual([]);
});

test("account history is identity-scoped in the UI",async({page})=>{
 const session=await mockSession(page);session.user=alice;
 const order={id:"FNM-20260916-1122334455667788",accountId:alice.id,vendorName:"Alice-only sample kitchen",date:"2026-09-17",area:"Yaba",total:16000};
 await page.route("**/api/account/orders?**",route=>route.fulfill({contentType:"application/json",body:JSON.stringify({orders:session.user?.id===alice.id?[order]:[]})}));
 await page.goto("/orders");await expect(page.getByRole("heading",{name:"Alice-only sample kitchen"})).toBeVisible();session.user={id:"22222222-2222-4222-8222-222222222222",email:"bob@example.invalid",name:"Bob Test"};await page.getByRole("button",{name:"Reload records"}).click();await expect(page.getByRole("heading",{name:"Alice-only sample kitchen"})).toHaveCount(0);await expect(page.getByText(/No account orders yet/)).toBeVisible();
});

test("auth screens fit narrow viewports",async({page})=>{await mockSession(page);for(const path of ["/login","/signup","/confirm-email"]){await page.goto(path);for(const width of [320,375,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBeTruthy();}}});

test("account API endpoints deny anonymous requests",async({request})=>{expect((await request.get("/api/account/orders")).status()).toBe(401);expect((await request.post("/api/orders/FNM-20260916-1122334455667788/claim",{data:{expectedAccountId:alice.id},headers:{Authorization:`Bearer ${"a".repeat(64)}`}})).status()).toBe(401);const status=await request.get("/api/auth/session");expect(status.status()).toBe(200);expect((await status.json()).user).toBe(null);});
