// Isolated application/security checks. Real SDK, simulated Auth HTTP responses,
// and a disposable SQLite database. No email, external account or real credentials.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const ts = require("typescript");
const { DatabaseSync } = require("node:sqlite");
const { createServerClient } = require("@supabase/ssr");
const { createClient } = require("@supabase/supabase-js");
const root = path.resolve(__dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "jie_bulk_order-accounts-"));
const opened = [];
const checks = [];
function pass(name) {
  checks.push(name);
  console.log("PASS:", name);
}
function compile(relative, dependencies, env = {}) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const scope = {
    module,
    exports: module.exports,
    require(name) {
      if (name in dependencies) return dependencies[name];
      if (name.startsWith("node:")) return require(name);
      throw new Error(`Unexpected import ${name} in ${relative}`);
    },
    process: { env, cwd: () => root },
    console,
    Buffer,
    URL,
    Uint8Array,
    TextEncoder,
    TextDecoder,
    Response,
    Request,
    Headers,
    setTimeout,
    clearTimeout,
    Date,
  };
  vm.runInNewContext(code, scope, { filename: relative });
  return module.exports;
}
async function reject(action, code) {
  try {
    await action();
    assert.fail(`Expected rejection: ${code}`);
  } catch (error) {
    assert.equal(error.code || error.storageCode, code);
  }
}
(async () => {
  try {
    const problems = compile("src/lib/server/problems.ts", {});
    const format = compile("src/lib/format.ts", {});
    const catalog = compile("src/lib/catalog.ts", {});
    const schema = compile("src/lib/schema.ts", { zod: require("zod") });
    const access = compile("src/lib/server/order-access.ts", {
      "./problems": problems,
    });
    const local = compile(
      "src/lib/server/sqlite-store.ts",
      {
        "server-only": {},
        "node:sqlite": {
          DatabaseSync: class extends DatabaseSync {
            constructor(...args) {
              super(...args);
              opened.push(this);
            }
          },
        },
      },
      { DATA_DIR: temp },
    );
    const store = local.getSqliteStore();
    const orders = compile("src/lib/server/orders.ts", {
      "server-only": {},
      "@/lib/catalog": catalog,
      "@/lib/format": format,
      "@/lib/schema": schema,
      "./storage": { getStore: async () => store },
      "./problems": problems,
      "./order-access": access,
    });
    const alice = "11111111-1111-4111-8111-111111111111",
      bob = "22222222-2222-4222-8222-222222222222";
    const draft = {
      vendorId: "sunday-pot",
      items: [{ itemId: "egusi", packIndex: 0, quantity: 1 }],
      area: "Yaba",
      date: format.shiftDay(format.todayLagos(), 1),
      slot: "lunch",
      customer: {
        name: "Demo Customer",
        phone: "08000000000",
        address: "12 Example Street (fictional)",
      },
      testAcknowledged: true,
      expectedTotal: 16000,
    };
    const save = async (body, user = null) => {
      const key = crypto.randomBytes(32).toString("hex"),
        request = crypto.randomBytes(16).toString("hex"),
        raw = JSON.stringify(body);
      return {
        ...(await orders.createTestOrder(raw, body, request, key, user)),
        key,
        request,
        raw,
      };
    };
    const guest = await save(draft);
    assert.equal(guest.order.accountId, null);
    assert.equal(
      (await orders.readTestOrder(guest.order.id, guest.key)).id,
      guest.order.id,
    );
    pass("Existing guest checkout and key-based retrieval remain available.");
    const owned = await save(
      { ...draft, accountCheckout: true, accountUserId: alice },
      alice,
    );
    assert.equal(owned.order.accountId, alice);
    assert.equal(
      (await orders.readTestOrder(owned.order.id, null, alice)).id,
      owned.order.id,
    );
    await reject(
      () => orders.readTestOrder(owned.order.id, owned.key, null),
      "ORDER_NOT_FOUND",
    );
    await reject(
      () => orders.readTestOrder(owned.order.id, owned.key, bob),
      "ORDER_NOT_FOUND",
    );
    pass(
      "Account records require their verified owner; even a correct guest key cannot bypass login.",
    );
    await reject(
      () =>
        save({ ...draft, accountCheckout: true, accountUserId: alice }, null),
      "AUTH_REQUIRED",
    );
    await reject(
      () =>
        save({ ...draft, accountCheckout: true, accountUserId: alice }, bob),
      "ACCOUNT_CHANGED",
    );
    pass(
      "Account checkout cannot silently become a guest order or move to a different session.",
    );
    const forged = await save(
      { ...draft, customer_id: alice, accountUserId: alice },
      bob,
    );
    assert.equal(forged.order.accountId, null);
    pass(
      "A client-supplied customer_id or unrequested account id does not grant ownership.",
    );
    const replay = await orders.createTestOrder(
      owned.raw,
      JSON.parse(owned.raw),
      owned.request,
      owned.key,
      alice,
    );
    assert.equal(replay.order.id, owned.order.id);
    assert.equal(replay.replayed, true);
    await reject(
      () =>
        orders.createTestOrder(
          owned.raw,
          JSON.parse(owned.raw),
          owned.request,
          owned.key,
          bob,
        ),
      "ACCOUNT_CHANGED",
    );
    await reject(
      () =>
        orders.createTestOrder(
          owned.raw,
          JSON.parse(owned.raw),
          owned.request,
          owned.key,
          null,
        ),
      "AUTH_REQUIRED",
    );
    pass(
      "Retrying an account order still requires the original owner and returns the same record.",
    );
    await save({ ...draft, accountCheckout: true, accountUserId: bob }, bob);
    const aliceRows = await orders.listAccountOrders(alice);
    assert.ok(aliceRows.length);
    assert.ok(aliceRows.every((row) => row.accountId === alice));
    assert.ok(!aliceRows.some((row) => row.id === guest.order.id));
    pass(
      "Account history is filtered by the server-verified user, excluding other users and unclaimed guests.",
    );
    await reject(
      () =>
        orders.claimGuestOrder(
          guest.order.id,
          crypto.randomBytes(32).toString("hex"),
          alice,
        ),
      "ORDER_NOT_FOUND",
    );
    const claimed = await orders.claimGuestOrder(
      guest.order.id,
      guest.key,
      alice,
    );
    assert.equal(claimed.accountId, alice);
    assert.equal(claimed.total, guest.order.total);
    await reject(
      () => orders.readTestOrder(guest.order.id, guest.key, null),
      "ORDER_NOT_FOUND",
    );
    await reject(
      () => orders.claimGuestOrder(guest.order.id, guest.key, bob),
      "ORDER_NOT_FOUND",
    );
    assert.equal(
      (await orders.claimGuestOrder(guest.order.id, guest.key, alice))
        .accountId,
      alice,
    );
    pass(
      "Guest linking requires its key, is explicit/idempotent, and cannot reassign an already-owned record.",
    );
    const race = await save(draft);
    const raced = await Promise.allSettled([
      orders.claimGuestOrder(race.order.id, race.key, alice),
      orders.claimGuestOrder(race.order.id, race.key, bob),
    ]);
    assert.equal(
      raced.filter((result) => result.status === "fulfilled").length,
      1,
    );
    pass("Concurrent claims result in one owner, not an overwrite.");

    const urlModule = compile("src/lib/server/supabase-url.ts", {});
    assert.equal(
      urlModule.canonicalSupabaseUrl("https://example.supabase.co/"),
      "https://example.supabase.co",
    );
    for (const url of [
      "https://example.supabase.co/rest/v1",
      "https://example.supabase.co?key=x",
      "https://supabase.com/dashboard/project/example",
      "https://user:password@example.supabase.co",
    ])
      assert.throws(() => urlModule.canonicalSupabaseUrl(url));
    pass(
      "Supabase configuration rejects REST paths, dashboard URLs, queries and URL credentials.",
    );

    // Use the actual SSR/Auth SDK with a simulated authoritative Auth HTTP server.
    const PUB = "sb_publishable_TEST_FIXTURE",
      SECRET = "sb_secret_NOT_FOR_AUTH";
    const jar = new Map();
    const writes = [];
    let getUserCalls = 0,
      refreshCalls = 0,
      clientOptions;
    const serverUser = {
      id: alice,
      aud: "authenticated",
      role: "authenticated",
      email: "alice@example.invalid",
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      app_metadata: { provider: "email" },
      user_metadata: { full_name: "Alice Test" },
    };
    const jwt = (exp) =>
      [
        Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
          "base64url",
        ),
        Buffer.from(
          JSON.stringify({
            sub: alice,
            aud: "authenticated",
            role: "authenticated",
            exp,
            iat: Math.floor(Date.now() / 1000),
            iss: "https://example.supabase.co/auth/v1",
          }),
        ).toString("base64url"),
        "SIMULATED_SIGNATURE",
      ].join(".");
    let currentToken = jwt(Math.floor(Date.now() / 1000) + 3600);
    const allowed = new Set([currentToken]);
    const cookieJar = {
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      set(name, value, options) {
        writes.push({ name, options });
        if (options?.maxAge === 0) jar.delete(name);
        else jar.set(name, value);
      },
    };
    const fakeAuthFetch = async (input, init) => {
      const url = new URL(
        typeof input === "string" ? input : input.url || String(input),
      );
      const h = new Headers(init?.headers);
      if (url.pathname.endsWith("/token")) {
        if (url.searchParams.get("grant_type") === "refresh_token") {
          refreshCalls++;
          currentToken = jwt(Math.floor(Date.now() / 1000) + 7200);
          allowed.add(currentToken);
        }
        return Response.json({
          access_token: currentToken,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: "TEST_REFRESH_VALUE",
          user: serverUser,
        });
      }
      if (url.pathname.endsWith("/user")) {
        getUserCalls++;
        if (allowed.has((h.get("authorization") || "").replace(/^Bearer /, "")))
          return Response.json(serverUser);
        return Response.json(
          { code: "bad_jwt", msg: "Token invalid" },
          { status: 401 },
        );
      }
      if (url.pathname.endsWith("/logout"))
        return new Response(null, { status: 204 });
      throw new Error(`Unexpected simulated Auth path ${url.pathname}`);
    };
    const auth = compile(
      "src/lib/server/auth.ts",
      {
        "server-only": {},
        "@supabase/ssr": {
          createServerClient: (url, key, options) => {
            assert.equal(key, PUB);
            clientOptions = options;
            return createServerClient(url, key, {
              ...options,
              global: { fetch: fakeAuthFetch },
            });
          },
        },
        "next/headers": {
          cookies: async () => cookieJar,
          headers: async () => new Headers({ host: "secure-test.example" }),
        },
        "./supabase-url": urlModule,
        "./problems": problems,
      },
      {
        ORDER_STORAGE: "supabase",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: PUB,
        SUPABASE_SECRET_KEY: SECRET,
        NODE_ENV: "production",
      },
    );
    assert.equal(await auth.verifiedCustomer(), null);
    const client = await auth.authClient();
    const signed = await client.auth.signInWithPassword({
      email: serverUser.email,
      password: "TEST_PASSWORD_NOT_REAL",
    });
    assert.equal(signed.error, null);
    assert.ok(jar.has("jie_bulk_order-customer-auth"));
    assert.ok(
      writes.every(
        (row) =>
          row.options.httpOnly === true &&
          row.options.secure === true &&
          row.options.sameSite === "lax",
      ),
    );
    assert.equal(clientOptions.cookieOptions.httpOnly, true);
    pass(
      "The real SSR SDK stores session cookies as HttpOnly/SameSite=Lax/Secure in HTTPS production settings, using the publishable—not secret—key.",
    );
    const encoded = jar.get("jie_bulk_order-customer-auth");
    assert.ok(encoded.startsWith("base64-"));
    const forgedCookie = JSON.parse(
      Buffer.from(encoded.slice(7), "base64url").toString("utf8"),
    );
    forgedCookie.user = {
      ...serverUser,
      id: bob,
      email: "forged@example.invalid",
      user_metadata: { role: "admin" },
    };
    jar.set(
      "jie_bulk_order-customer-auth",
      "base64-" +
        Buffer.from(JSON.stringify(forgedCookie)).toString("base64url"),
    );
    const verified = await auth.verifiedCustomer();
    assert.equal(verified.id, alice);
    assert.equal(verified.email, serverUser.email);
    assert.ok(getUserCalls > 0);
    pass(
      "Cookie user/role claims are not trusted: a fresh Auth-server getUser result determines identity.",
    );
    const expired = {
      ...forgedCookie,
      access_token: jwt(Math.floor(Date.now() / 1000) - 60),
      expires_at: Math.floor(Date.now() / 1000) - 60,
    };
    jar.set(
      "jie_bulk_order-customer-auth",
      `base64-${Buffer.from(JSON.stringify(expired)).toString("base64url")}`,
    );
    assert.equal((await auth.verifiedCustomer()).id, alice);
    assert.ok(refreshCalls > 0);
    pass(
      "An expired session is refreshed through the real SDK, with updated cookies written server-side.",
    );
    const invalid = {
      ...forgedCookie,
      access_token: `${jwt(Math.floor(Date.now() / 1000) + 9999)}X`,
      expires_at: Math.floor(Date.now() / 1000) + 9999,
    };
    jar.set(
      "jie_bulk_order-customer-auth",
      `base64-${Buffer.from(JSON.stringify(invalid)).toString("base64url")}`,
    );
    await reject(() => auth.verifiedCustomer(), "SESSION_EXPIRED");
    assert.ok(!jar.has("jie_bulk_order-customer-auth"));
    pass(
      "A rejected/forged token does not authenticate and its local session cookies are cleared.",
    );

    // Verify the real storage adapter performs a GET probe rather than a false-positive HEAD.
    const requestMethods = [];
    const mockStorage = (fetcher) => {
      const sdk = {
        createClient: (url, key, options) =>
          createClient(url, key, { ...options, global: { fetch: fetcher } }),
      };
      return compile(
        "src/lib/server/storage.ts",
        {
          "server-only": {},
          "@supabase/supabase-js": sdk,
          "./supabase-url": urlModule,
        },
        {
          ORDER_STORAGE: "supabase",
          SUPABASE_URL: "https://example.supabase.co",
          SUPABASE_SECRET_KEY: SECRET,
        },
      );
    };
    const storage = mockStorage(async (_input, init) => {
      requestMethods.push(init?.method || "GET");
      return Response.json([], {
        status: 200,
        headers: { "content-range": "*/0" },
      });
    });
    await (await storage.getStore()).ping();
    assert.deepEqual(requestMethods, ["GET"]);
    pass(
      "The database health probe now uses a real GET response, closing the earlier permissive HEAD-check gap.",
    );
    const badStore = mockStorage(
      async () => new Response(null, { status: 404 }),
    );
    await reject(
      async () => (await badStore.getStore()).ping(),
      "READ_NOT_CONFIRMED",
    );
    pass(
      "A 404/empty response cannot be normalized into a successful health result.",
    );

    const memorySession = new Map(),
      memoryLocal = new Map();
    const clientCode = fs.readFileSync(
      path.join(root, "src/lib/client-store.ts"),
      "utf8",
    );
    const clientJS = ts.transpileModule(clientCode, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const clientModule = { exports: {} };
    const storageStub = (map) => ({
      getItem: (key) => map.get(key) || null,
      setItem: (key, value) => map.set(key, value),
      removeItem: (key) => map.delete(key),
    });
    vm.runInNewContext(clientJS, {
      module: clientModule,
      exports: clientModule.exports,
      require: (name) =>
        name === "react"
          ? { useSyncExternalStore: (_subscribe, snapshot) => snapshot() }
          : name === "./catalog"
            ? catalog
            : (() => {
                throw new Error(name);
              })(),
      sessionStorage: storageStub(memorySession),
      localStorage: storageStub(memoryLocal),
      queueMicrotask,
      crypto: crypto.webcrypto,
    });
    clientModule.exports.finishOrder(owned.order, owned.key);
    assert.equal(
      JSON.parse(memoryLocal.get("jie_bulk_order-test-order-access-v2")).length,
      0,
    );
    pass(
      "An account order’s idempotency/access key is not retained as a reusable guest credential in browser local storage.",
    );
    for (const code of [
      "AUTH_REQUIRED",
      "SESSION_EXPIRED",
      "ACCOUNT_CHANGED",
      "REQUEST_CONFLICT",
      "INVALID_INPUT",
    ]) {
      let cleared = false;
      class ClientFailure extends Error {
        constructor() {
          super("Simulated rejection");
          this.code = code;
          this.status =
            code === "ACCOUNT_CHANGED" || code === "REQUEST_CONFLICT"
              ? 409
              : code === "INVALID_INPUT"
                ? 400
                : 401;
        }
      }
      const fakeAPI = {
        RequestError: ClientFailure,
        errorText: (error) => error.message,
        requestJson: () => Promise.reject(new ClientFailure()),
      };
      const fakeStore = {
        finishOrder() {},
        savePending(value) {
          if (value === null) cleared = true;
        },
        setSubmission() {},
      };
      const saveModule = compile("src/lib/save-order.ts", {
        "./api-client": fakeAPI,
        "./client-store": fakeStore,
      });
      try {
        await saveModule.sendPending({
          requestKey: "test",
          key: "test",
          bodyJSON: "{}",
        });
      } catch {}
      assert.equal(cleared, code === "INVALID_INPUT");
    }
    pass(
      "Authentication/session errors preserve an uncertain pending save; only definitive input rejection clears it.",
    );
    fs.mkdirSync(path.join(root, "test-results"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "test-results/security-check.json"),
      JSON.stringify(
        {
          scope:
            "Real application modules and SSR SDK; simulated Auth HTTP, disposable local database. Not a live Supabase email/account integration test.",
          passed: checks,
        },
        null,
        2,
      ),
    );
  } finally {
    for (const db of opened) db.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
