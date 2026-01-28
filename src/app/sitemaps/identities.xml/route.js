import { ASSETS_URL, buildUrlSet, SITE_URL } from "@/app/lib/sitemap";


export async function GET() {
    const res = await fetch(`${ASSETS_URL}/data/identities.json`);
    const data = await res.json();

    const urls = Object.keys(data).map((b) => ({
        loc: `${SITE_URL}/identities/${b}`,
    }));

    return new Response(buildUrlSet(urls), {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400',
        },
    });
}
