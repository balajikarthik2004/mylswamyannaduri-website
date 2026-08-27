"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The console's front door.
 *
 * Deliberately not styled like the public site. The visitor-facing pages are
 * warm ivory and editorial; a back office wants to feel like an instrument —
 * so the identity sits on an ink panel and the form gets a plain, bright
 * working surface beside it. The split also gives the page somewhere to say
 * what this is, which a bare centred form cannot do without looking like an
 * error state.
 */
export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/office/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "mt-2 w-full rounded-xl border border-line bg-card px-4 py-3 text-[0.92rem] " +
    "text-ink shadow-sink transition-all duration-200 placeholder:text-ink-4 " +
    "focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/8";
  const label =
    "block font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-3";

  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.85fr_1.15fr]">
      {/* ── Identity panel ─────────────────────────────────── */}
      {/* Full-height column on desktop; a header band on a phone, where a
          bare form on paper would give no clue what it belongs to. */}
      <aside className="relative overflow-hidden bg-ink px-7 py-9 text-paper sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14">
        {/* A single cool wash keeps the panel from reading as flat black */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full opacity-45 blur-[90px]"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent-2), transparent 70%)",
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-20 h-[24rem] w-[24rem] rounded-full opacity-25 blur-[90px]"
          style={{
            background:
              "radial-gradient(circle, var(--color-brass), transparent 70%)",
          }}
        />

        <div className="relative flex items-baseline gap-2.5">
          <span className="font-display text-[1.3rem] leading-none tracking-[-0.015em]">
            M. Annadurai
          </span>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-paper/45">
            ISRO
          </span>
        </div>

        <div className="relative mt-7 max-w-sm lg:mt-0">
          <span className="metal-rule block h-px w-12" aria-hidden="true" />
          <h1 className="mt-4 font-display text-[1.85rem] leading-[1.05] tracking-[-0.03em] lg:mt-6 lg:text-[2.7rem]">
            Office console
          </h1>
          <p className="mt-3.5 text-[0.88rem] leading-relaxed text-paper/60 lg:mt-5 lg:text-[0.95rem]">
            Engagement requests arrive here for review. Approving or declining
            one writes the decision to his diary and emails the requester.
          </p>
        </div>

        <p className="relative mt-8 hidden items-center gap-2.5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-paper/35 lg:mt-0 lg:flex">
          <span aria-hidden="true">◆</span>
          Authorised access only
        </p>
      </aside>

      {/* ── Sign-in ────────────────────────────────────────── */}
      <main className="flex items-center justify-center bg-paper px-6 py-14 sm:px-10">
        <div className="w-full max-w-sm">
          <p className="kicker">Restricted</p>
          <h2 className="mt-4 font-display text-[2rem] leading-none tracking-[-0.03em] text-ink">
            Sign in
          </h2>
          <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-3">
            Enter the office credentials to review engagement requests.
          </p>

          {!configured ? (
            <p className="mt-7 rounded-xl border border-ember/20 bg-ember-soft px-4 py-3.5 text-[0.8rem] leading-relaxed text-ember">
              No credentials are configured on this server. Set{" "}
              <code className="font-mono">ADMIN_USER</code>,{" "}
              <code className="font-mono">ADMIN_PASSWORD</code> and{" "}
              <code className="font-mono">ADMIN_SECRET</code> in{" "}
              <code className="font-mono">.env</code>, then restart.
            </p>
          ) : null}

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="user" className={label}>
                Username
              </label>
              <input
                id="user"
                value={user}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                onChange={(e) => setUser(e.target.value)}
                className={field}
              />
            </div>

            <div>
              <label htmlFor="password" className={label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className={field}
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-ember/20 bg-ember-soft px-4 py-3 text-[0.82rem] leading-relaxed text-ember"
              >
                <span aria-hidden="true" className="mt-px shrink-0">
                  ⚠
                </span>
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy || !configured}
              aria-busy={busy}
              className="btn btn-primary w-full justify-center px-6 py-3.5 text-[0.9rem] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {busy ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/30 border-t-paper"
                  />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <span className="btn-arrow" aria-hidden="true">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          <p className="mt-10 border-t border-line pt-5 font-mono text-[0.58rem] uppercase leading-relaxed tracking-[0.14em] text-ink-4">
            Sessions expire after eight hours
          </p>
        </div>
      </main>
    </div>
  );
}
