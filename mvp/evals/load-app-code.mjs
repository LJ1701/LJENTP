// Lets this plain Node script load the app's own files the way Next.js does:
// "./i18n" means "./i18n.js", and the "server-only" guard (which only matters inside Next.js) is skipped.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
    if (specifier.startsWith(".") && !String(context.parentURL).includes("/node_modules/") && !/\.[cm]?js$|\.json$/.test(specifier) && context.parentURL) {
      const url = new URL(specifier + ".js", context.parentURL);
      if (existsSync(fileURLToPath(url))) return next(url.href, context);
    }
    return next(specifier, context);
  }
});
