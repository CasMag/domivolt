// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // ¡Esta línea es la más importante!
  site: 'https://domivolt.com', 
  integrations: [sitemap()]
});
