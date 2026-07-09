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
  const endpoints: Array<{ name: string; path: string }> = [
    { name: "health", path: "/api/health" },
    { name: "dashboard-summary", path: "/api/dashboard/summary" },
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

      const looksOk = result.status >= 200 && result.status < 300;
      const successIsTrue = successFlag === true;

      if (typeof successFlag === "boolean") {
        ok = ok && looksOk && successIsTrue;
      } else {
        ok = ok && looksOk;
      }

      console.log(
        `[${e.name}] ${e.path} -> status=${result.status} success=${String(successFlag)}`,
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
