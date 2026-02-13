import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

console.log("DEPLOY SCRIPT RUNNING");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(backendRoot, "..");

const distPath = path.join(projectRoot, "Frontend", "dist");
const backendPublicPath = path.join(backendRoot, "public");

if (!fs.existsSync(distPath)) {
  throw new Error("Cannot find Frontend dist folder");
}

fs.rmSync(backendPublicPath, { recursive: true, force: true });

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);

    for (const entry of entries) {
      copyRecursive(
        path.join(src, entry),
        path.join(dest, entry)
      );
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(distPath, backendPublicPath);

console.log("Frontend copied successfully");
