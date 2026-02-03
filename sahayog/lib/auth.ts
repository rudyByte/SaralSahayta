import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "OTP",
            credentials: {
                token: { label: "Token", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.token) return null;

                try {
                    // Verify the token issued by ourverify-otp API
                    const decoded = jwt.verify(credentials.token, SECRET) as any;

                    if (!decoded.userId) return null;

                    // Fetch user to confirm existence
                    const user = await prisma.user.findUnique({
                        where: { id: decoded.userId }
                    });

                    if (user) {
                        return {
                            id: user.id,
                            name: user.fullName,
                            email: user.email,
                            phone: user.phone,
                            isNewUser: decoded.isNewUser
                        };
                    }
                    return null;
                } catch (e) {
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.userId = user.id;
                token.phone = (user as any).phone;
                token.isNewUser = (user as any).isNewUser;
            }
            if (trigger === "update" && session) {
                // Allow client to update session (e.g. after profile completion)
                token.name = session.user.name;
                token.isNewUser = false;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.userId;
                (session.user as any).phone = token.phone;
                (session.user as any).isNewUser = token.isNewUser;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
