/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/libs/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      // Include the user's ID from the database in the session
      if (session.user) {
        session.user.id = user.id;
      }
      
      // Forward the access token to the client
      if (token) {
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
      }
      
      return session;
    },
    async jwt({ token, account, profile }) {
      // Save the access token and refresh token to the JWT on initial sign-in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.profile = profile;
      }
      
      // Check if token is about to expire and refresh it
      if (token.expiresAt && Date.now() >= (token.expiresAt as number) * 1000 - 60000) {
        try {
          const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          });
          
          const tokens = await response.json();
          
          if (!response.ok) throw tokens;
          
          return {
            ...token,
            accessToken: tokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
          };
        } catch (error) {
          console.error("Error refreshing access token", error);
          // The refresh token may have been revoked or expired
          // Sign the user out in this case
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }
      
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    // You can define custom error, verification and other pages here too
  },
  session: {
    strategy: "jwt", // Use JWT strategy to make token available for token callback
  },
  secret: process.env.NEXTAUTH_SECRET!,
  debug: process.env.NODE_ENV === "development",
};

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    profile?: any;
    error?: string;
  }
}