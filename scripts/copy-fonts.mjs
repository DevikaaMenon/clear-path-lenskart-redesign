// Copies open-licensed (SIL OFL) font files from @fontsource packages into src/app/fonts
// so next/font/local can self-host them. Cross-platform (no shell commands).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const out = join(root, "src", "app", "fonts");
mkdirSync(out, { recursive: true });

const files = [
  ["@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2", "fraunces-var.woff2"],
  ["@fontsource-variable/fraunces/files/fraunces-latin-full-italic.woff2", "fraunces-var-italic.woff2"],
  ["@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff2", "atkinson-400.woff2"],
  ["@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-500-normal.woff2", "atkinson-500.woff2"],
  ["@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-700-normal.woff2", "atkinson-700.woff2"],
  ["@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2", "jetbrains-mono-var.woff2"],
];

let missing = 0;
for (const [src, dest] of files) {
  const from = join(root, "node_modules", src);
  if (!existsSync(from)) {
    console.warn(`[fonts] missing ${src}`);
    missing++;
    continue;
  }
  copyFileSync(from, join(out, dest));
}
console.log(`[fonts] copied ${files.length - missing}/${files.length} font files to src/app/fonts`);
