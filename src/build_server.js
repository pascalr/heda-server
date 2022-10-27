import { build } from "esbuild";

await build({
  bundle: true,
  // Defines env variables for bundled JavaScript; here `process.env.NODE_ENV`
  //define: { "process.env.NODE_ENV": JSON.stringify('production') },
  entryPoints: ["src/server/image.js"],
  //minify: true,
  outdir: "src/build",
  format: "esm",
  loader: {
    '.jpg': 'dataurl',
    '.jpeg': 'dataurl',
    '.png': 'dataurl',
    '.svg': 'dataurl'
  },
  //sourcemap: true,
})
