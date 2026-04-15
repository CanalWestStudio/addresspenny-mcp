#!/usr/bin/env node
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const stage = join(root, "dxt-build");
const distDir = join(root, "dist");
const output = join(distDir, "addresspenny-mcp.dxt");

console.log("Building TypeScript...");
execSync("npm run build", { stdio: "inherit" });

console.log("Preparing staging directory...");
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

cpSync(join(root, "manifest.json"), join(stage, "manifest.json"));
cpSync(join(root, "README.md"), join(stage, "README.md"));
cpSync(join(root, "LICENSE"), join(stage, "LICENSE"));
cpSync(join(root, "icon.png"), join(stage, "icon.png"));
cpSync(join(root, "build"), join(stage, "build"), { recursive: true });

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const stagedPkg = {
  name: pkg.name,
  version: pkg.version,
  type: pkg.type,
  main: "build/index.js",
  dependencies: pkg.dependencies
};
writeFileSync(join(stage, "package.json"), JSON.stringify(stagedPkg, null, 2));

console.log("Installing production dependencies into staging...");
execSync("npm install --omit=dev --no-package-lock --silent", {
  cwd: stage,
  stdio: "inherit"
});

mkdirSync(distDir, { recursive: true });
rmSync(output, { force: true });

console.log(`Packing ${output}...`);
execSync(`npx dxt pack ${JSON.stringify(stage)} ${JSON.stringify(output)}`, {
  stdio: "inherit"
});

if (!existsSync(output)) {
  console.error("DXT pack did not produce an output file");
  process.exit(1);
}

console.log(`\nBuilt ${output}`);
