/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Background from "./components/BackgroundCanvas"; // ← dynamic/ssr:false を使わず、通常インポート

export const metadata: Metadata = {
  title: "Momoyo Yamaguchi | Brand Director",
  description:
    "Brand Director / Creative Director based in Kyoto. Founder of andlphin.",
  openGraph: {
    title: "Momoyo Yamaguchi | Brand Director",
    description:
      "Brand Director / Creative Director based in Kyoto. Founder of andlphin.",
    url: "https://your-domain.vercel.app/",
    siteName: "Momoyo Yamaguchi Portfolio",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Momoyo Yamaguchi Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Momoyo Yamaguchi | Brand Director",
    description:
      "Brand Director / Creative Director based in Kyoto. Founder of andlphin.",
  },
  icons: {
    icon: [
      { url: "/favicons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      {
        url: "/favicons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function Page() {
  return (
    <main className="stack">
      <div className="bg-layer" aria-hidden>
        <Background />
      </div>

      <div
        style={{
          textAlign: "center",
          lineHeight: 1.7,
          background: "rgba(255,255,255,0.42)",
          backdropFilter: "saturate(140%) blur(5px)",
          borderRadius: 16,
          padding: "2.2rem",
          boxShadow: "0 6px 35px rgba(0,0,0,0.08)",
        }}
        className="introduce-card"
      >
        <div>
          <picture>
            <source
              srcSet="/logo-sp.svg"
              media="(max-width: 800px)"
              type="image/svg+xml"
            />
            <img
              src="/logo.svg"
              alt="Momoyo Yamaguchi – Brand Director"
              className="logo"
            />
          </picture>
        </div>

        <p
          style={{
            marginTop: "1.4rem",
            fontSize: "0.9rem",
            color: "#616161",
            marginBottom: "1.2rem",
          }}
        >
          Brand Director / Creative Director based in Kyoto.
          <br />
          Founder of the fashion brand{" "}
          <a href="https://www.instagram.com/andolphin.jp/">
            <strong>andolphin</strong>.
          </a>
        </p>

        <p
          style={{
            fontSize: "0.9rem",
            color: "#616161",
            marginBottom: "1.6rem",
          }}
        >
          The portfolio site is currently in production.
          <br />
          Please check back soon.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.2rem",
            fontSize: "0.9rem",
          }}
        >
          <a
            href="https://www.instagram.com/peachworld.404/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline", color: "#616161" }}
          >
            Instagram
          </a>
          <a
            href="mailto:contact@momo.hitokuchi@gmail.com"
            style={{ textDecoration: "underline", color: "#616161" }}
          >
            Email
          </a>
        </div>
      </div>

      <footer
        style={{
          position: "fixed",
          bottom: "1.2rem",
          fontSize: "0.8rem",
          color: "#9aa",
          letterSpacing: "0.05em",
          margin: "0 auto",
        }}
      >
        © {new Date().getFullYear()} Momoyo Yamaguchi
      </footer>
    </main>
  );
}
