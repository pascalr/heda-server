import { build } from "esbuild";

// FIXME: Share entrypoints with dev...
await build({
  bundle: true,
  // Defines env variables for bundled JavaScript; here `process.env.NODE_ENV`
  define: { "process.env.NODE_ENV": JSON.stringify('production') },
  entryPoints: ["src/react/bundle.jsx", "src/react/user_editor.jsx", "src/react/admin.jsx"],
  minify: true,
  outdir: "public/build",
  loader: {
    '.jpg': 'dataurl',
    '.jpeg': 'dataurl',
    '.png': 'dataurl',
    '.svg': 'dataurl'
  },
  sourcemap: true,
})
