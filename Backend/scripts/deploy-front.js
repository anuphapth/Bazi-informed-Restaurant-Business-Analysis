import fs from "fs";
import path from "path";

const root = process.cwd();
const projectRoot = path.resolve(root, "..");

const distPath = path.join(projectRoot, "Frontend", "dist");
const backendPublicPath = path.join(root, "public");

console.log("Clean Backend/public...");
fs.rmSync(backendPublicPath, { recursive: true, force: true });

console.log("Copy Frontend/dist → Backend/public...");
fs.cpSync(distPath, backendPublicPath, { recursive: true });

console.log("Frontend copied to Backend/public");
