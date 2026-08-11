import { spawn } from "node:child_process";

const node = process.execPath;
const vite = new URL(
  "../node_modules/vite/bin/vite.js",
  import.meta.url,
).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const playwright = new URL(
  "../node_modules/@playwright/test/cli.js",
  import.meta.url,
).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const previewUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173";

const server = spawn(node, [vite, "preview", "--host", "127.0.0.1"], {
  stdio: "inherit",
  windowsHide: true,
});

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(previewUrl);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("E2E用サーバーを起動できませんでした。");
}

async function stopServer() {
  if (server.exitCode !== null) return;
  await new Promise((resolve) => {
    server.once("exit", resolve);
    server.kill();
  });
}

let exitCode;
try {
  await waitForServer();
  exitCode = await new Promise((resolve, reject) => {
    const tests = spawn(node, [playwright, "test"], {
      stdio: "inherit",
      windowsHide: true,
    });
    tests.once("exit", (code) => resolve(code ?? 1));
    tests.once("error", reject);
  });
} finally {
  await stopServer();
}

process.exitCode = exitCode;
