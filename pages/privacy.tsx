import Head from "next/head";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Dentle</title>
      </Head>
      <main className="legalPage">
        <a className="legalBack" href="/">Dentle</a>
        <p className="eyebrow">Sebrium Industries</p>
        <h1>Privacy Policy</h1>
        <p>Last updated June 27, 2026.</p>

        <h2>Information Dentle collects</h2>
        <p>Dentle records anonymous game activity such as page views, board selections, guesses, results, and attempt counts. Dentle may also record coarse location information, such as country, region, city, and timezone when supplied by hosting providers, plus device information such as device type, browser, and operating system. If you request daily reminders or case explanations, Dentle also stores your email address.</p>

        <h2>Player statistics</h2>
        <p>Dentle uses a browser identifier and a one-way hash derived from network information to synchronize statistics and limit duplicate records. Raw IP addresses are not stored in the player statistics tables or analytics dashboard.</p>

        <h2>How information is used</h2>
        <p>Information is used to operate the game, maintain player statistics, improve cases, measure usage by region and device, prevent abuse, and send reminders or case explanations requested by subscribers.</p>

        <h2>Service providers</h2>
        <p>Dentle uses infrastructure, database, and email providers, including Vercel, Supabase, and Resend, to operate the service.</p>

        <h2>Contact</h2>
        <p>Questions can be sent to <a href="mailto:hello@sebrium.com">hello@sebrium.com</a>.</p>
      </main>
    </>
  );
}
