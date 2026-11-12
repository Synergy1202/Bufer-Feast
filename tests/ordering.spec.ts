import {test,expect,type Page} from "@playwright/test";
import {randomBytes} from "node:crypto";

// This suite creates FICTIONAL records in the running LOCAL test database.
// It refuses Supabase/cloud mode; never point development tests at production data.
test.beforeEach(async({request})=>{const response=await request.get("/api/health");expect(response.ok()).toBeTruthy();expect((await response.json()).mode).toBe("local-test");});
async function checkout(page:Page){
  await page.goto("/kitchens/sunday-pot");
  await page.getByTestId("menu-item-egusi").getByRole("button",{name:/Add Egusi soup/}).click();
  await page.locator('header a[href="/basket"]').click();
  await expect(page.getByTestId("basket-subtotal")).toHaveText("₦14,500");
  await page.getByRole("link",{name:/Continue to test checkout/}).click();
  await expect(page.locator(".storage-status")).toContainText("Local SQLite test mode");
  await page.getByRole("button",{name:"Fill sample details"}).click();
  await expect(page.getByTestId("quote-total")).toHaveText("₦16,000");
}

test("area/date discovery uses real Next routes, with empty and reset states",async({page,request})=>{
  const health=await (await request.get("/api/health")).json();
  await page.goto("/");await page.getByRole("button",{name:"Find my food"}).click();await expect(page.locator("#discovery-error")).toContainText("Choose a delivery area");
  await page.locator("#discovery-area").selectOption("Yaba");await page.getByRole("button",{name:"Find my food"}).click();await expect(page).toHaveURL(/\/kitchens\?area=Yaba/);await expect(page.locator(".kitchen-card")).toHaveCount(1);
  await page.getByRole("button",{name:"Rice & sides",exact:true}).click();await expect(page.getByRole("heading",{name:"No sample matches just yet."})).toBeVisible();
  await page.getByRole("button",{name:"Clear filters"}).click();await expect(page.locator(".kitchen-card")).toHaveCount(3);
  await page.locator("#discovery-area").selectOption("Other");await page.locator("#discovery-date").fill(health.minimumDate);await page.getByRole("button",{name:"Find my food"}).click();await expect(page.getByRole("heading",{name:"No sample matches just yet."})).toBeVisible();
});

test("basket quantity, removal and explicit kitchen replacement work",async({page})=>{
  await page.goto("/kitchens/sunday-pot");await page.locator("#pack-sunday-pot-egusi").selectOption("1");await page.getByTestId("menu-item-egusi").getByRole("button",{name:/Add Egusi/}).click();await page.locator('header a[href="/basket"]').click();await expect(page.getByTestId("basket-subtotal")).toHaveText("₦33,500");
  await page.getByRole("button",{name:"Increase Egusi soup quantity"}).click();await expect(page.getByTestId("basket-subtotal")).toHaveText("₦67,000");
  await page.goto("/kitchens/everyday-kitchen");await page.getByTestId("menu-item-jollof").getByRole("button",{name:/Add Smoky jollof/}).click();await expect(page.getByRole("dialog")).toBeVisible();await page.getByRole("button",{name:"Keep my current basket"}).click();await expect(page.getByTestId("basket-count")).toHaveText("2");
  await page.getByTestId("menu-item-jollof").getByRole("button",{name:/Add Smoky jollof/}).click();await page.getByRole("button",{name:"Replace basket"}).click();await page.locator('header a[href="/basket"]').click();await expect(page.getByTestId("basket-subtotal")).toHaveText("₦18,500");
  await page.getByRole("button",{name:"Remove Smoky jollof rice"}).click();await expect(page.getByRole("heading",{name:"A little empty, for now."})).toBeVisible();
});

test("checkout validates, changes quotes, persists a private record and reloads it",async({page})=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));await checkout(page);
  await expect(page.getByRole("checkbox")).not.toBeChecked();await page.getByRole("button",{name:"Save test order"}).click();await expect(page.locator("#checkout-error")).toContainText("acknowledge");
  await page.locator("#checkout-phone").fill("123");await page.getByRole("button",{name:"Save test order"}).click();await expect(page.locator("#checkout-error")).toBeVisible();await page.locator("#checkout-phone").fill("08000000000");
  await page.locator("#checkout-area").selectOption("Ikeja");await expect(page.getByTestId("quote-total")).toHaveText("₦16,500");await page.locator("#checkout-area").selectOption("Yaba");await expect(page.getByTestId("quote-total")).toHaveText("₦16,000");
  await page.getByRole("checkbox").check();await page.getByRole("button",{name:"Save test order"}).click();await expect(page.getByTestId("order-reference")).toBeVisible();const reference=await page.getByTestId("order-reference").innerText();await expect(page.locator(".order-success")).toContainText("No payment taken");await expect(page.getByTestId("basket-count")).toHaveText("0");
  await page.reload();await expect(page.getByTestId("order-reference")).toHaveText(reference);await page.getByRole("button",{name:"Reload from server"}).click();await expect(page.locator(".reload-feedback")).toContainText("Retrieved from the server again");
  await page.locator('header a[href="/orders"]:visible').first().click();await expect(page.locator(".saved-order-card")).toHaveCount(1);expect(errors).toEqual([]);
});

test("a lost response can be retried after a refresh without a duplicate",async({page})=>{
  let calls=0,reference="";
  await page.route("**/api/orders",async route=>{calls++;if(calls===1){const response=await route.fetch();reference=(await response.json()).order.id;await route.abort("failed");}else await route.continue();});
  await checkout(page);await page.getByRole("checkbox").check();await page.getByRole("button",{name:"Save test order"}).click();await expect(page.getByRole("button",{name:"Retry the same save"})).toBeEnabled();await expect(page.getByTestId("order-reference")).toHaveCount(0);
  await page.reload();await page.getByRole("button",{name:"Retry the same save"}).click();await expect(page.getByTestId("order-reference")).toHaveText(reference);expect(calls).toBe(2);
});

test("an unavailable storage connection does not create a fake confirmation",async({page})=>{
  await page.route("**/api/health",route=>route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:"Supabase is not configured. Check .env.local."})}));
  await page.goto("/kitchens/sunday-pot");await page.getByTestId("menu-item-egusi").getByRole("button",{name:/Add Egusi/}).click();await page.locator('header a[href="/basket"]').click();await page.getByRole("link",{name:/Continue to test checkout/}).click();await expect(page.locator(".storage-status")).toContainText("Supabase is not configured");await expect(page.getByRole("button",{name:"Save test order"})).toBeDisabled();
});

test("mobile flow and document widths remain usable",async({page})=>{
  await page.setViewportSize({width:390,height:844});await checkout(page);
  for(const width of [320,375,390,640,768,1024,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBeTruthy();}
  await page.setViewportSize({width:390,height:844});await page.getByRole("checkbox").check();await page.getByRole("button",{name:"Save test order"}).click();await expect(page.getByTestId("order-reference")).toBeVisible();await page.locator('header a[href="/orders"]:visible').first().click();await expect(page.locator(".saved-order-card")).toHaveCount(1);
  await page.goto("/");await page.getByRole("button",{name:"Open navigation"}).click();await expect(page.locator("#mobile-nav")).toBeVisible();await page.keyboard.press("Escape");await expect(page.locator("#mobile-nav")).toHaveCount(0);
  for(const width of [320,375,390,640,768,1024,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBeTruthy();}
});

test("server rejects bad payloads and altered totals; retries require the private key",async({request})=>{
  const health=await (await request.get("/api/health")).json();
  const body={vendorId:"sunday-pot",items:[{itemId:"egusi",packIndex:0,quantity:1}],area:"Yaba",date:health.minimumDate,slot:"lunch",customer:{name:"Demo Customer",phone:"08000000000",address:"12 Example Street (fictional)"},testAcknowledged:true,expectedTotal:16000};
  const key=randomBytes(32).toString("hex"),requestKey=randomBytes(16).toString("hex"),headers={"Idempotency-Key":requestKey,"X-Order-Access":key};
  const quote=await request.post("/api/quote",{data:{...body,items:[{...body.items[0],unitPrice:1,lineTotal:1}]}});expect(quote.status()).toBe(200);expect((await quote.json()).quote.total).toBe(16000);
  for(const patch of [{area:"Lekki"},{date:health.today},{date:"2026-02-30"},{slot:"midnight"},{items:[{itemId:"egusi",packIndex:99,quantity:1}]},{items:[{itemId:"egusi",packIndex:0,quantity:0}]},{items:[{itemId:"egusi",packIndex:0,quantity:1.5}]},{items:[{itemId:"egusi",packIndex:0,quantity:100}]},{items:[{itemId:"egusi",packIndex:0,quantity:1,vendorId:"everyday-kitchen"}]}])expect((await request.post("/api/quote",{data:{...body,...patch}})).status()).toBe(400);
  expect((await request.post("/api/orders",{data:{...body,expectedTotal:1},headers})).status()).toBe(409);expect((await request.post("/api/orders",{data:{...body,testAcknowledged:false},headers})).status()).toBe(400);
  const first=await request.post("/api/orders",{data:body,headers});expect(first.status()).toBe(201);const order=(await first.json()).order;expect(order.status).toBe("received");expect(order.paymentStatus).toBe("not_requested");
  const again=await request.post("/api/orders",{data:body,headers});expect(again.status()).toBe(200);expect((await again.json()).order.id).toBe(order.id);
  expect((await request.post("/api/orders",{data:{...body,customer:{...body.customer,name:"Changed Demo"}},headers})).status()).toBe(409);
  expect((await request.get(`/api/orders/${order.id}`)).status()).toBe(404);expect((await request.get(`/api/orders/${order.id}`,{headers:{Authorization:`Bearer ${randomBytes(32).toString("hex")}`}})).status()).toBe(404);
  const lookup=await request.get(`/api/orders/${order.id}`,{headers:{Authorization:`Bearer ${key}`}});expect(lookup.status()).toBe(200);expect((await lookup.json()).order.total).toBe(16000);
  const concurrentHeaders={"Idempotency-Key":randomBytes(16).toString("hex"),"X-Order-Access":randomBytes(32).toString("hex")};
  const pair=await Promise.all([request.post("/api/orders",{data:body,headers:concurrentHeaders}),request.post("/api/orders",{data:body,headers:concurrentHeaders})]);expect(pair.map(response=>response.status()).sort()).toEqual([200,201]);expect((await pair[0].json()).order.id).toBe((await pair[1].json()).order.id);
  expect((await request.post("/api/quote",{data:body,headers:{Origin:"https://not-this-site.example"}})).status()).toBe(403);
  expect((await request.post("/api/quote",{data:JSON.stringify({padding:"x".repeat(17000)}),headers:{"Content-Type":"application/json"}})).status()).toBe(413);
  for(const url of ["/data/orders.sqlite","/.env.local","/src/lib/server/storage.ts","/server.js"])expect((await request.get(url)).status()).toBe(404);
});
