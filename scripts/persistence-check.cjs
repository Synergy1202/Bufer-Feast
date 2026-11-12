// Run with Node.js 24 after npm run build. Uses disposable local data, never your data/.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "jie_bulk_order-next-proof-"));
let child;
async function freePort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function start(mode) {
  const port = await freePort();
  child = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        ORDER_STORAGE: mode,
        DATA_DIR: temp,
        SUPABASE_URL: "",
        SUPABASE_SECRET_KEY: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  await new Promise((resolve, reject) => {
    let output = "",
      errors = "";
    const timer = setTimeout(
      () => reject(new Error(`Server startup timed out. ${errors}`)),
      20000,
    );
    child.stdout.on("data", (data) => {
      output += data;
      if (output.includes("Ready")) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.stderr.on("data", (data) => (errors += data));
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (!output.includes("Ready"))
        reject(new Error(`Server exited ${code}: ${errors}`));
    });
    child.once("error", reject);
  });
  return `http://127.0.0.1:${port}`;
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const done = once(child, "exit");
  child.kill("SIGTERM");
  const timer = setTimeout(() => child.kill("SIGKILL"), 6000);
  await done;
  clearTimeout(timer);
}
(async () => {
  try {
    if (!fs.existsSync(path.join(root, ".next/BUILD_ID")))
      throw new Error("Run npm run build first.");
    let base = await start("local");
    const health = await (await fetch(`${base}/api/health`)).json();
    assert.equal(health.mode, "local-test");
    const key = crypto.randomBytes(32).toString("hex");
    const requestKey = crypto.randomBytes(16).toString("hex");
    const body = {
      vendorId: "sunday-pot",
      items: [{ itemId: "egusi", packIndex: 0, quantity: 1 }],
      area: "Yaba",
      date: health.minimumDate,
      slot: "lunch",
      customer: {
        name: "Demo Customer",
        phone: "08000000000",
        address: "12 Example Street (fictional)",
      },
      testAcknowledged: true,
      expectedTotal: 16000,
    };
    const created = await fetch(`${base}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": requestKey,
        "X-Order-Access": key,
      },
      body: JSON.stringify(body),
    });
    assert.equal(created.status, 201);
    const { order } = await created.json();
    await stop();
    base = await start("local");
    const response = await fetch(`${base}/api/orders/${order.id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    assert.equal(response.status, 200);
    const stored = (await response.json()).order;
    assert.equal(stored.id, order.id);
    assert.equal(stored.total, 16000);
    assert.equal(stored.createdAt, order.createdAt);
    assert.equal(stored.status, "received");
    console.log(
      "PASS: a production-built Next.js server retrieves the same local record after restarting.",
    );
    await stop();
    base = await start("supabase");
    const unavailable = await fetch(`${base}/api/health`);
    assert.equal(unavailable.status, 503);
    const error = await unavailable.json();
    assert.equal(error.code, "STORAGE_UNAVAILABLE");
    console.log(
      "PASS: missing Supabase configuration fails explicitly instead of silently using local SQLite.",
    );
  } finally {
    await stop();
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
