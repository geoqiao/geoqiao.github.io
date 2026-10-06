import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import checkLinks from "./src/integrations/check-links.mjs";

const config = parse(readFileSync(new URL("./config.yaml", import.meta.url), "utf8"));

// Every address ends in a slash and lives in its own directory, as it always has.
export default defineConfig({
  site: config.site.url,
  trailingSlash: "always",
  build: { format: "directory" },
  compressHTML: false,
  devToolbar: { enabled: false },
  integrations: [checkLinks()],
});
