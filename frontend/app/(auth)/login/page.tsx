"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/projects");
    }
  }, [session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">
              QP
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to QuestionPilot
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to automate your RFP responses
          </p>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => signIn("google", { callbackUrl: "/projects" })}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:bg-accent"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => signIn("microsoft", { callbackUrl: "/projects" })}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:bg-accent"
          >
            <svg className="h-5 w-5" viewBox="0 0 23 23">
              <rect width="10.5" height="10.5" fill="#F25022" />
              <rect x="12.5" width="10.5" height="10.5" fill="#7FBA00" />
              <rect y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
              <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
            </svg>
            Continue with Microsoft
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
