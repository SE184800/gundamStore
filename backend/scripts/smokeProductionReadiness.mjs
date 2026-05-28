const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:4800";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

async function readJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function checkHealth() {
  const response = await fetch(`${BACKEND_URL}/health`);
  const data = await readJson(response);

  if (!response.ok || data?.status !== "ok") {
    throw new Error(`/health failed HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  console.log("✅ /health works");
}

async function checkReadiness() {
  const response = await fetch(`${BACKEND_URL}/health/ready`);
  const data = await readJson(response);

  if (!response.ok || data?.status !== "ready" || data?.database !== "connected") {
    throw new Error(`/health/ready failed HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  console.log("✅ /health/ready works and database is connected");
}

async function checkCorsPreflight() {
  const response = await fetch(`${BACKEND_URL}/api/products`, {
    method: "OPTIONS",
    headers: {
      Origin: FRONTEND_ORIGIN,
      "Access-Control-Request-Method": "GET",
    },
  });

  const allowOrigin = response.headers.get("access-control-allow-origin") || "";

  if (!response.ok && response.status !== 204) {
    throw new Error(`CORS preflight failed HTTP ${response.status}`);
  }

  if (allowOrigin !== FRONTEND_ORIGIN) {
    throw new Error(`CORS allow-origin mismatch. expected=${FRONTEND_ORIGIN}, actual=${allowOrigin}`);
  }

  console.log("✅ CORS preflight allows configured frontend origin");
}

async function run() {
  console.log("======================================");
  console.log("Production Readiness Smoke Test");
  console.log("Backend:", BACKEND_URL);
  console.log("Frontend Origin:", FRONTEND_ORIGIN);
  console.log("======================================");

  await checkHealth();
  await checkReadiness();
  await checkCorsPreflight();

  console.log("======================================");
  console.log("Result: 3/3 passed");
  console.log("======================================");
}

run().catch((error) => {
  console.error("❌ Production readiness smoke failed:", error);
  process.exit(1);
});
