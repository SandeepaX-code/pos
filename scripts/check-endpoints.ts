import http from "node:http";

type JsonBody = unknown;

type FetchResult = { status: number; body: JsonBody };

function fetchJson(pathname: string): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: pathname,
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const status = res.statusCode ?? 0;
          try {
            const body = data ? JSON.parse(data) : null;
            resolve({ status, body });
          } catch {
            resolve({ status, body: data });
          }
        });
      },
    );

    req.on("error", (err) => reject(err));
    req.end();
  });
}

async function main() {
  const endpoints: Array<{ name: string; path: string; expectedStatuses?: number[] }> = [
    { name: "health", path: "/api/health", expectedStatuses: [200] },
    { name: "dashboard-summary", path: "/api/dashboard/summary", expectedStatuses: [200, 401] },
    { name: "permissions", path: "/api/permissions", expectedStatuses: [401] },
    { name: "admin-permissions", path: "/api/admin/permissions", expectedStatuses: [401] },
    { name: "users", path: "/api/users", expectedStatuses: [401] },
    { name: "roles", path: "/api/roles", expectedStatuses: [401] },
    { name: "admin-categories", path: "/api/admin/categories", expectedStatuses: [401] },
    { name: "admin-products", path: "/api/admin/products", expectedStatuses: [401] },
    { name: "inventory", path: "/api/inventory", expectedStatuses: [401] },
    { name: "inventory-adjust", path: "/api/inventory/adjust", expectedStatuses: [401, 405] },
    { name: "tables", path: "/api/tables", expectedStatuses: [401] },
    { name: "checkout", path: "/api/checkout", expectedStatuses: [401, 405] },
    { name: "bills", path: "/api/bills", expectedStatuses: [401] },
  ];

  const startedAt = Date.now();
  let ok = true;

  for (const e of endpoints) {
    try {
      const result = await fetchJson(e.path);

      let successFlag: unknown = undefined;
      if (
        result.body &&
        typeof result.body === "object" &&
        "success" in (result.body as Record<string, unknown>)
      ) {
        successFlag = (result.body as Record<string, unknown>).success;
      }

      const expected = e.expectedStatuses ?? [200];
      const statusOk = expected.includes(result.status);

      ok = ok && statusOk;

      console.log(
        `[${e.name}] ${e.path} -> status=${result.status} (expected ${expected.join("/")})`,
      );
    } catch (err) {
      ok = false;
      console.error(`[${e.name}] ${e.path} -> ERROR`, err);
    }
  }

  const elapsedMs = Date.now() - startedAt;
  console.log(`\nDone in ${elapsedMs}ms. Overall: ${ok ? "PASS" : "FAIL"}`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
