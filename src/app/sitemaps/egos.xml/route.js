import { SITE_URL, ASSETS_URL, buildUrlSet } from "@/app/lib/sitemap";

export async function GET() {
    const res = await fetch(`${ASSETS_URL}/data/egos.json`);
    const data = await res.json();

    const urls = Object.keys(data).map((b) => ({
        loc: `${SITE_URL}/egos/${b}`,
    }));

    return new Response(buildUrlSet(urls), {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400',
        },
    });
}
