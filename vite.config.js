import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = import.meta.dirname;
const pages = ['index', 'about', 'skills', 'projects', 'certifications', 'contact'];

/**
 * Inject shared HTML partials and make public assets work when deployed
 * under the GitHub Pages project path (/new3d/).
 */
function htmlPartials() {
  const pattern = /<!--\s*@include\s+([\w-]+)\s*-->/g;
  return {
    name: 'html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replace(pattern, (_, name) =>
            readFileSync(resolve(root, 'partials', `${name}.html`), 'utf8').trim()
          )
          // Links to public/ assets must be relative on project Pages sites.
          .replace(/(["'])\/(images\/|favicon\.svg)/g, '$1$2')
          // Canonical, Open Graph, and structured-data URLs.
          .replaceAll('https://aman-0402.github.io/asport/', 'https://workwithaastha.github.io/new3d/');
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('partials')) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [htmlPartials()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(root, `${p}.html`)])),
    },
  },
});
