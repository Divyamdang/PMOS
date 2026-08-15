import { signIn } from "@/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/dashboard";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4" style={{ background: "var(--graphite)" }}>
      <div className="flex flex-col items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-semibold"
          style={{ background: "var(--route)", color: "var(--primary-foreground)", fontFamily: "var(--font-mono)" }}
        >
          W
        </span>
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
          WTS
        </h1>
        <p className="max-w-xs text-center text-sm" style={{ color: "var(--muted-2)" }}>
          What the Shizzz — your team&apos;s product operating system. Sign in with your Google account to get in.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: callbackUrl });
        }}
      >
        <button
          type="submit"
          className="flex items-center gap-3 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)]"
          style={{ borderColor: "var(--border-subtle)", background: "var(--card)", color: "var(--foreground)" }}
        >
          <GoogleIcon />
          Sign in with Google
        </button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.71A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z" />
    </svg>
  );
}
