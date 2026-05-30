import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const pfxPath = path.resolve(".cert/dev-cert.pfx");
const useHttps = process.env.VITE_DEV_HTTPS === "1";

export default defineConfig({
  plugins: [react()],
  server: useHttps
    ? {
        https: {
          pfx: fs.readFileSync(pfxPath),
          passphrase: "camera-transfer-dev",
        },
      }
    : undefined,
});
