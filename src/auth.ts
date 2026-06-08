import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyFirebaseToken } from "@/lib/firebaseAdmin";
import { consumeEmailOtp } from "@/lib/otp";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "email-password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email }).lean();
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        return {
          id: (user._id as { toString(): string }).toString(),
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
        };
      },
    }),
    Credentials({
      id: "email-otp",
      credentials: {
        phone: { label: "Phone" },
        otp: { label: "OTP" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;
        const result = await consumeEmailOtp({
          purpose: "login",
          key: credentials.phone as string,
          otp: credentials.otp as string,
        });
        if (!result.ok) return null;
        await connectDB();
        const user = await User.findOne({ email: result.email });
        if (!user) return null;
        if (!user.emailVerified) {
          user.emailVerified = new Date();
          await user.save();
        }
        return {
          id: user._id.toString(),
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
        };
      },
    }),
    Credentials({
      id: "phone",
      credentials: { idToken: { label: "Firebase ID Token" } },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;
        const decoded = await verifyFirebaseToken(credentials.idToken as string);
        if (!decoded?.phone_number) return null;
        await connectDB();
        let user = await User.findOne({ phone: decoded.phone_number });
        if (!user) {
          user = await User.create({ phone: decoded.phone_number, name: decoded.phone_number });
        }
        return {
          id: user._id.toString(),
          name: user.name ?? decoded.phone_number,
          email: user.email ?? null,
          image: user.image ?? null,
          phone: decoded.phone_number,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        await connectDB();
        const cookieStore = await cookies();
        const linkUserId = cookieStore.get("linking_user_id")?.value;

        if (linkUserId) {
          // Link Google to an existing phone-only account
          const phoneUser = await User.findById(linkUserId);
          if (phoneUser && !phoneUser.email) {
            phoneUser.email = profile.email;
            phoneUser.googleId = profile.sub as string | undefined;
            phoneUser.image = (profile as { picture?: string }).picture ?? phoneUser.image;
            phoneUser.emailVerified = new Date();
            if (phoneUser.name === phoneUser.phone) {
              phoneUser.name = profile.name ?? phoneUser.name;
            }
            await phoneUser.save();
            cookieStore.delete("linking_user_id");
            return true;
          }
        }

        // Normal Google sign-in flow
        const existing = await User.findOne({ email: profile.email });
        if (!existing) {
          await User.create({
            name: profile.name ?? undefined,
            email: profile.email,
            image: (profile as { picture?: string }).picture ?? undefined,
            googleId: profile.sub ?? undefined,
            emailVerified: new Date(),
          });
        } else if (!existing.googleId) {
          existing.googleId = profile.sub as string;
          await existing.save();
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile, trigger }) {
      if (trigger === "update" && token.id) {
        await connectDB();
        const dbUser = await User.findById(token.id as string).lean();
        if (dbUser) {
          token.name = dbUser.name ?? token.name;
          token.email = dbUser.email ?? token.email;
          token.picture = dbUser.image ?? token.picture;
        }
        return token;
      }
      if (user) {
        token.id = user.id;
        token.phone = (user as { phone?: string }).phone;
        if (user.name) token.name = user.name;
      }
      if (account?.provider === "google" && profile?.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: profile.email }).lean();
        if (dbUser) {
          token.id = (dbUser._id as { toString(): string }).toString();
          if (dbUser.name) token.name = dbUser.name;
        }
        if (profile.name) token.name = profile.name;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { phone?: string }).phone = token.phone as string | undefined;
      if (token.name) session.user.name = token.name as string;
      return session;
    },
  },
  pages: { signIn: "/" },
});
