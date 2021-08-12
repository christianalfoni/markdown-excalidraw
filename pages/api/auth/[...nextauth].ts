import NextAuth from "next-auth";
import Providers from "next-auth/providers";

export default NextAuth({
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      scope: "repo",
    }),
  ],
  callbacks: {
    async jwt(token, user, account) {
      return user && account
        ? {
            ...user,
            accessToken: account.accessToken,
          }
        : token;
    },
    async session(session, token) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
