import fs from "fs";
import path from "path";

const backendRoot = process.cwd();
const projectRoot = path.resolve(backendRoot, "..");

const possibleDirs = ["dist", "build"];
let distPath = null;

for (const dir of possibleDirs) {
  const p = path.join(projectRoot, "Frontend", dir);
  if (fs.existsSync(p)) {
    distPath = p;
    break;
  }
}

if (!distPath) {
  throw new Error("Cannot find Frontend build output (dist or build)");
}

const backendPublicPath = path.join(backendRoot, "public");

console.log("Clean Backend/public...");
fs.rmSync(backendPublicPath, { recursive: true, force: true });

console.log(`Copy ${distPath} → Backend/public...`);
fs.cpSync(distPath, backendPublicPath, { recursive: true });

console.log("Frontend copied successfully");
