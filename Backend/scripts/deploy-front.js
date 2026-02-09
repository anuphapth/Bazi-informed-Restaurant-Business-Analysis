import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();

const frontendPath = path.join(root, "Frontend");
const distPath = path.join(frontendPath, "dist");
const backendPublicPath = path.join(root, "Backend", "public");

console.log("Install + build frontend...");
execSync("npm install && npm run build", {
  cwd: frontendPath,
  stdio: "inherit",
  shell: true
});

console.log("Clean Backend/public...");
fs.rmSync(backendPublicPath, { recursive: true, force: true });

console.log("Copy Frontend/dist → Backend/public...");
fs.cpSync(distPath, backendPublicPath, { recursive: true });

console.log("Frontend deployed");