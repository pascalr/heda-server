import { build } from "esbuild";

await build({
  bundle: true,
  // Defines env variables for bundled JavaScript; here `process.env.NODE_ENV`
  define: { "process.env.NODE_ENV": 'production' },
  entryPoints: ["src/react/error.jsx", "src/react/app.jsx", "src/react/user_editor.jsx", "src/react/home.jsx", "src/react/show_user.jsx", "src/react/show_recipe.jsx"],
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
