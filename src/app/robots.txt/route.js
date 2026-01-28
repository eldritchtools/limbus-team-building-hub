import { SITE_URL } from "../lib/sitemap";

export function GET() {
  return new Response(
`User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap_index.xml
`,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  );
}
