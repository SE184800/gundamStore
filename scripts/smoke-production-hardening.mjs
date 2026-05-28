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

  try {
    const { response, data } = await request("/api/products");
    const products = data?.products || data?.data || [];

    const candidate = products.find((product) => Number(product.stock || 0) < 99);

    if (!response.ok || !Array.isArray(products)) {
      fail("Oversell order is rejected", `Cannot load products. HTTP ${response.status}`);
    } else if (!candidate) {
      pass("Oversell order is rejected", "Skipped because no product has stock below 99");
    } else {
      const stock = Number(candidate.stock || 0);
      const quantity = Math.min(99, Math.max(1, stock + 1));
      const productId = candidate.backendProductId || candidate.productId || candidate.id;

      const payload = {
        customerName: "Smoke Oversell Test",
        customerPhone: "0900000000",
        customerEmail: "smoke@example.com",
        customerAddress: "Smoke test address",
        shippingFee: 0,
        discount: 0,
        items: [
          {
            productId,
            sku: candidate.sku || "",
            slug: candidate.slug || "",
            quantity,
          },
        ],
      };

      const result = await request("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if ([400, 409].includes(result.response.status) && result.data?.success === false) {
        pass(
          "Oversell order is rejected",
          `HTTP ${result.response.status}; stock=${stock}; requested=${quantity}`
        );
      } else {
        fail(
          "Oversell order is rejected",
          `Expected 400/409 but got HTTP ${result.response.status} ${JSON.stringify(result.data)}`
        );
      }
    }
  } catch (err) {
    fail("Oversell order is rejected", err.message);
  }


  if (token) {
    try {
      const { response, data } = await request("/api/account/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok && data?.success && data?.account) {
        pass("Account profile API works", `HTTP ${response.status}`);
      } else {
        fail("Account profile API works", `HTTP ${response.status} ${JSON.stringify(data)}`);
      }
    } catch (err) {
      fail("Account profile API works", err.message);
    }

    try {
      const { response, data } = await request("/api/account/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "Admin Demo",
          phone: "0901234567",
          gender: "Nam",
          city: "Hồ Chí Minh",
          district: "Quận 1",
          ward: "Phường Bến Nghé",
          address: "Smoke test address",
          postalCode: "700000",
        }),
      });

      if (response.ok && data?.success && data?.account?.profile?.phone === "0901234567") {
        pass("Account profile update works", `HTTP ${response.status}`);
      } else {
        fail("Account profile update works", `HTTP ${response.status} ${JSON.stringify(data)}`);
      }
    } catch (err) {
      fail("Account profile update works", err.message);
    }

    try {
      const productResult = await request("/api/products");
      const products = productResult.data?.products || productResult.data?.data || [];
      const product = products.find((item) => item?.id);

      if (!product) {
        pass("Wishlist API add/list/remove works", "Skipped because no product exists");
      } else {
        const addResult = await request("/api/account/wishlist", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
          }),
        });

        const listResult = await request("/api/account/wishlist", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const items = listResult.data?.items || [];
        const found = items.some((item) => item.productId === product.id);

        const removeResult = await request(`/api/account/wishlist/${encodeURIComponent(product.id)}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (
          [200, 201].includes(addResult.response.status) &&
          listResult.response.ok &&
          found &&
          removeResult.response.ok
        ) {
          pass("Wishlist API add/list/remove works", `product=${product.sku || product.id}`);
        } else {
          fail(
            "Wishlist API add/list/remove works",
            JSON.stringify({
              add: addResult.response.status,
              list: listResult.response.status,
              found,
              remove: removeResult.response.status,
            })
          );
        }
      }
    } catch (err) {
      fail("Wishlist API add/list/remove works", err.message);
    }
  } else {
    fail("Account profile API works", "Skipped because login token is missing");
    fail("Account profile update works", "Skipped because login token is missing");
    fail("Wishlist API add/list/remove works", "Skipped because login token is missing");
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
