import "./globals.css";
import Script from "next/script";
import LayoutComponent from "./layoutComponent";

export const metadata = {
    title: "Limbus Company Team Building Hub",
    description: "View team builds or create your own to share. Look up relevant information on identities and E.G.Os",
    metadataBase: new URL("https://limbus-builds.eldritchtools.com"),
    alternates: {
        canonical: "https://limbus-builds.eldritchtools.com",
    }
};


export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <link rel="icon" href="/favicon.ico" />
                <meta name="viewport" content="width=device-width, initial-scale=0.7"/>
                <Script async src="https://www.googletagmanager.com/gtag/js?id=G-XZJ5KQTJJ9" />
                <Script id="google-analytics">
                    {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', 'G-XZJ5KQTJJ9', {page_path: window.location.pathname});
                    `}
                </Script>
            </head>
            <body style={{ display: "flex", flexDirection: "column" }} className={`antialiased`}>
                <LayoutComponent>{children}</LayoutComponent>
            </body>
        </html>
    );
}
