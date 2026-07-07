import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import MicrosoftProvider from "next-auth/providers/azure-ad";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-google-client-id",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "placeholder-google-client-secret",
    }),
    MicrosoftProvider({
      clientId:
        process.env.MICROSOFT_CLIENT_ID || "placeholder-microsoft-client-id",
      clientSecret:
        process.env.MICROSOFT_CLIENT_SECRET ||
        "placeholder-microsoft-client-secret",
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      if (profile) {
        token.id = (profile as Record<string, unknown>).sub as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "placeholder-secret-change-in-production",
};
