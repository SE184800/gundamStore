const BACKEND_URL = (process.env.BACKEND_URL || "").replace(/\/$/, "");
const FRONTEND_URL = (process.env.FRONTEND_URL || "").replace(/\/$/, "");

function assertEnv(name, value) {
  if (!value) {
    throw new Error(`${name} is required.`);
  }
}

async function readBody(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function checkBackendHealth() {
  const response = await fetch(`${BACKEND_URL}/health`);
  const data = await readBody(response);

  if (!response.ok || data?.status !== "ok") {
    throw new Error(`/health failed HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  console.log("✅ Backend /health works");
}

async function checkBackendReadiness() {
  const response = await fetch(`${BACKEND_URL}/health/ready`);
  const data = await readBody(response);

  if (!response.ok || data?.status !== "ready") {
    throw new Error(`/health/ready failed HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  console.log("✅ Backend /health/ready works");
}

async function checkCors() {
  const response = await fetch(`${BACKEND_URL}/api/products`, {
    method: "OPTIONS",
    headers: {
      Origin: FRONTEND_URL,
      "Access-Control-Request-Method": "GET",
    },
  });

  const allowOrigin = response.headers.get("access-control-allow-origin") || "";

  if (!response.ok && response.status !== 204) {
    throw new Error(`CORS preflight failed HTTP ${response.status}`);
  }

  if (allowOrigin !== FRONTEND_URL) {
    throw new Error(`CORS mismatch. expected=${FRONTEND_URL}, actual=${allowOrigin}`);
  }

  console.log("✅ Backend CORS allows frontend origin");
}

async function checkFrontend() {
  const response = await fetch(FRONTEND_URL);
  const text = await response.text();

  if (!response.ok || !text.includes("<html")) {
    throw new Error(`Frontend check failed HTTP ${response.status}`);
  }

  console.log("✅ Frontend returns HTML");
}

async function checkFrontendSpaRoute() {
  const response = await fetch(`${FRONTEND_URL}/orders`);
  const text = await response.text();

  if (!response.ok || !text.includes("<html")) {
    throw new Error(`Frontend SPA route /orders failed HTTP ${response.status}`);
  }

  console.log("✅ Frontend SPA rewrite works");
}

async function run() {
  assertEnv("BACKEND_URL", BACKEND_URL);
  assertEnv("FRONTEND_URL", FRONTEND_URL);

  console.log("======================================");
  console.log("UAT Public Smoke Test");
  console.log("Backend:", BACKEND_URL);
  console.log("Frontend:", FRONTEND_URL);
  console.log("======================================");

  await checkBackendHealth();
  await checkBackendReadiness();
  await checkCors();
  await checkFrontend();
  await checkFrontendSpaRoute();

  console.log("======================================");
  console.log("Result: 5/5 passed");
  console.log("======================================");
}

run().catch((error) => {
  console.error("❌ UAT public smoke failed:", error);
  process.exit(1);
});
