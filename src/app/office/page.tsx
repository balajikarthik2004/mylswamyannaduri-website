import type { Metadata } from "next";
import { adminConfigured, currentSession } from "@/lib/server/admin-auth";
import { readAll } from "@/lib/server/booking-store";
import { mailProvider } from "@/lib/server/mailer";
import { LoginForm } from "@/components/office/LoginForm";
import { RequestsBoard } from "@/components/office/RequestsBoard";

/**
 * The office console.
 *
 * Unlisted rather than truly hidden: nothing on the site links here, and the
 * page asks search engines to stay away, but the path is guessable and the
 * credentials are what actually hold the door. Treating the URL as the secret
 * would be the mistake — it leaks through history, referrers and logs.
 */
export const metadata: Metadata = {
  title: "Office",
  robots: { index: false, follow: false, nocache: true },
};

// Session and store are both per-request state; nothing here may be cached.
export const dynamic = "force-dynamic";

export default async function OfficePage() {
  const session = await currentSession();

  if (!session) {
    return <LoginForm configured={adminConfigured()} />;
  }

  const records = await readAll();
  return (
    <RequestsBoard
      initial={records}
      provider={mailProvider()}
      user={session.user}
    />
  );
}
