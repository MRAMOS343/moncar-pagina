// scripts/write-version.mjs
// Genera src/version.generated.ts y public/version.json antes del build.
// No requiere dependencias.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function safeExec(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const root = process.cwd();
const pkgPath = path.join(root, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const version = pkg.version ?? "0.0.0";
const commit = safeExec("git rev-parse --short HEAD");
const branch = safeExec("git rev-parse --abbrev-ref HEAD");
const buildTime = new Date().toISOString();

const tsOut = `// AUTO-GENERATED. Do not edit.
export const APP_VERSION = ${JSON.stringify(version)};
export const GIT_COMMIT = ${JSON.stringify(commit)};
export const GIT_BRANCH = ${JSON.stringify(branch)};
export const BUILD_TIME = ${JSON.stringify(buildTime)};
`;

fs.mkdirSync(path.join(root, "src"), { recursive: true });
fs.writeFileSync(path.join(root, "src", "version.generated.ts"), tsOut, "utf8");

fs.mkdirSync(path.join(root, "public"), { recursive: true });
fs.writeFileSync(
  path.join(root, "public", "version.json"),
  JSON.stringify({ version, commit, branch, buildTime }, null, 2),
  "utf8"
);

console.log("✓ Wrote src/version.generated.ts and public/version.json");
