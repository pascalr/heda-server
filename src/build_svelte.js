import esbuild from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";

export function buildSvelte() {
  
  esbuild.build({
    entryPoints: ["src/svelte/signup.js"],
    mainFields: ["svelte", "browser", "module", "main"],
    bundle: true,
    minify: false,
    sourcemap: true,
    outdir: "./public/build",
    plugins: [
      esbuildSvelte({
        preprocess: sveltePreprocess(),
      }),
    ],
  })
  .catch(() => process.exit(1));
}
