const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:4800";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@gundam.local";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "admin123";

const results = [];

function pass(name, detail = "") {
  results.push({ ok: true, name, detail });
  console.log(`✅ ${name}${detail ? ` - ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ ok: false, name, detail });
  console.error(`❌ ${name}${detail ? ` - ${detail}` : ""}`);
}

async function readJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await readJson(response);

  return {
    response,
    data,
  };
}

async function run() {
  console.log("======================================");
  console.log("Production Hardening Smoke Test");
  console.log("Backend:", BACKEND_URL);
  console.log("Admin:", ADMIN_EMAIL);
  console.log("======================================");

  let token = "";

  try {
    const { response, data } = await request("/health");

    if (response.ok && data?.success) {
      pass("Backend health check", `HTTP ${response.status}`);
    } else {
      fail("Backend health check", `HTTP ${response.status} ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("Backend health check", err.message);
  }

  try {
    const { response, data } = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    token = data?.token || data?.data?.token || data?.accessToken || "";

    if (response.ok && token) {
      pass("Admin login returns token", `HTTP ${response.status}`);
    } else {
      fail("Admin login returns token", `HTTP ${response.status} ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("Admin login returns token", err.message);
  }

  if (token) {
    try {
      const { response, data } = await request("/api/products/admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok && data?.success) {
        pass("Protected product admin API", `HTTP ${response.status}`);
      } else {
        fail("Protected product admin API", `HTTP ${response.status} ${JSON.stringify(data)}`);
      }
    } catch (err) {
      fail("Protected product admin API", err.message);
    }
  } else {
    fail("Protected product admin API", "Skipped because login token is missing");
  }

  try {
    const { response, data } = await request("/api/orders/public/SMOKE-NOT-FOUND?phone=0900000000");

    if (response.status === 404 && data?.success === false) {
      pass("Public order lookup invalid order returns 404", data?.message || "");
    } else {
      fail("Public order lookup invalid order returns 404", `HTTP ${response.status} ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("Public order lookup invalid order returns 404", err.message);
  }

  try {
    const { response, data } = await request("/api/orders/public/SMOKE-NOT-FOUND");

    if (response.status === 400 && data?.success === false) {
      pass("Public order lookup requires phone/email", data?.message || "");
    } else {
      fail("Public order lookup requires phone/email", `HTTP ${response.status} ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("Public order lookup requires phone/email", err.message);
  }

  const failed = results.filter((item) => !item.ok);

  console.log("======================================");
  console.log(`Result: ${results.length - failed.length}/${results.length} passed`);
  console.log("======================================");

  if (failed.length > 0) {
    process.exit(1);
  }
}

run();
