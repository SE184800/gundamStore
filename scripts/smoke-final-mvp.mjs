const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:4800";

const frontendPaths = [
  "/",
  "/shop",
  "/order-lookup",
  "/support",
  "/contact",
  "/return-request",
  "/shipping-policy",
  "/return-policy",
  "/payment-guide",
  "/warranty",
  "/faq",
  "/admin/login",
];

const backendPaths = [
  "/health",
  "/api/products",
  "/api/products/categories",
];

async function check(url) {
  const response = await fetch(url, {
    redirect: "manual",
  });

  return {
    url,
    status: response.status,
    ok: response.status < 500,
  };
}

async function main() {
  const results = [];

  for (const path of frontendPaths) {
    results.push(await check(`${FRONTEND_URL}${path}`));
  }

  for (const path of backendPaths) {
    results.push(await check(`${BACKEND_URL}${path}`));
  }

  console.table(results);

  const failed = results.filter((item) => !item.ok);

  if (failed.length) {
    console.error("Smoke failed:", failed);
    process.exit(1);
  }

  console.log("Final MVP smoke passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
