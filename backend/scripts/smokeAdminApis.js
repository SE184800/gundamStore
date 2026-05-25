const BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gundam.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok || data?.success === false) {
    throw new Error(`${path} failed: ${response.status} ${JSON.stringify(data).slice(0, 500)}`);
  }

  return data;
}

async function main() {
  console.log(`Smoke test API base: ${BASE_URL}`);

  await request("/health");
  console.log("✅ /health");

  const login = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  const token = login.token;

  if (!token) {
    throw new Error("Login did not return token.");
  }

  console.log("✅ /api/auth/login");

  const checks = [
    "/api/products/admin",
    "/api/products/admin/reference",
    "/api/inventory/dashboard",
    "/api/inventory/receipts",
    "/api/inventory/adjustments",
    "/api/inventory/stock-counts",
    "/api/inventory/transactions",
    "/api/pricing/products",
    "/api/pricing/prices",
    "/api/promotions/admin",
  ];

  for (const path of checks) {
    await request(path, { token });
    console.log(`✅ ${path}`);
  }

  await request("/api/products", { token: "" });
  console.log("✅ /api/products public");

  await request("/api/promotions/public/active", { token: "" });
  console.log("✅ /api/promotions/public/active public");

  console.log("Smoke test completed.");
}

main().catch((error) => {
  console.error("Smoke test failed.");
  console.error(error);
  process.exit(1);
});
