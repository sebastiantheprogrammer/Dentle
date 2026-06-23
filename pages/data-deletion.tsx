import Head from "next/head";

export default function DataDeletion() {
  return (
    <>
      <Head>
        <title>Data Deletion | Dentle</title>
      </Head>
      <main className="legalPage">
        <a className="legalBack" href="/">Dentle</a>
        <p className="eyebrow">Sebrium Industries</p>
        <h1>Data Deletion</h1>
        <p>To request deletion of information associated with your Dentle reminder email, contact <a href="mailto:hello@sebrium.com?subject=Dentle%20Data%20Deletion">hello@sebrium.com</a> with the subject “Dentle Data Deletion.”</p>

        <h2>What to include</h2>
        <p>Include the email address used to subscribe. Do not send passwords, government identification, payment information, or other sensitive documents.</p>

        <h2>Browser data</h2>
        <p>You can remove locally stored game identifiers and cached statistics by clearing site data for Dentle in your browser settings.</p>

        <h2>Processing</h2>
        <p>Sebrium Industries will verify the request using the supplied email address and remove matching subscriber information and reasonably associated records.</p>
      </main>
    </>
  );
}
