const { existsSync } = require("fs");
const { spawnSync } = require("child_process");
const { join } = require("path");

const root = join(__dirname, "..");

function ensureInstall(relativeDir, label) {
  const target = join(root, relativeDir);
  if (existsSync(join(target, "node_modules"))) {
    return;
  }

  console.log(`Installing ${label} dependencies...`);
  const result = spawnSync("npm", ["install"], {
    cwd: target,
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

ensureInstall(".", "root");
ensureInstall("server", "server");
ensureInstall("client", "client");
