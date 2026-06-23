import type { AppProps } from "next/app";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <footer className="siteFooter">
        <span>© 2026 Sebrium Industries</span>
        <span aria-hidden="true">|</span>
        <a href="mailto:hello@sebrium.com">hello@sebrium.com</a>
        <span aria-hidden="true">|</span>
        <a href="/privacy">Privacy Policy</a>
        <span aria-hidden="true">|</span>
        <a href="/data-deletion">Data Deletion</a>
      </footer>
    </>
  );
}
