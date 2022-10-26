import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from "esbuild";
import chokidar from "chokidar";
import sass from 'sass';
import livereload from 'livereload';
import connectLivereload from 'connect-livereload';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function enableLiveReload(app) {

  // Setup js file builder
  const builder = await build({
    // Bundles JavaScript.
    bundle: true,
    // Defines env variables for bundled JavaScript; here `process.env.NODE_ENV`
    // is propagated with a fallback.
    define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development") },
    // Bundles JavaScript from (see `outfile`).
    entryPoints: ["src/react/error.jsx", "src/react/app.jsx", "src/react/user_editor.jsx", "src/react/home.jsx", "src/react/show_user.jsx", "src/react/show_recipe.jsx"],
    // Uses incremental compilation (see `chokidar.on`).
    incremental: true,
    // Removes whitespace, etc. depending on `NODE_ENV=...`.
    minify: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod",
    // Bundles JavaScript to (see `entryPoints`).
    outdir: "public/build",
  
    sourcemap: true,
  })

  // open livereload high port and start to watch public directory for changes
  //const liveReloadServer = livereload.createServer({exts: ['js', 'css'], applyCSSLive: false});
  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(__dirname, '../public/build/'));
  
  // ping browser on Express boot, once browser has reconnected and handshaken
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });
  
  // monkey patch every served HTML so they know of changes
  app.use(connectLivereload());

  // Setup watch for building js files
  chokidar.watch("src/**/*.{js,jsx}", {
      interval: 0, // No delay
    }).on("change", () => {
      console.log('************** REBUILDING JS ***************')
      // Rebuilds esbuild (incrementally -- see `build.incremental`).
      builder.rebuild()
    })
  
  // Setup watch for building sass files
  chokidar.watch("src/**/*.scss", {
      interval: 0, // No delay
    }).on("all", (type, filename) => {
      console.log('************** REBUILDING CSS ***************')
      let p = path.join(__dirname, filename.substr(4))
      let name = path.basename(filename)
      name = name.substr(0, name.length-4)+'css'
      let out = path.join(__dirname, '../public/build', name)
      const result = sass.compile(p);
      console.log('out', out)
      fs.writeFile(out, result.css, function (err) {
        if (err) return console.log(err);
      });
    })
}
