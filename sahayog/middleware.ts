import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        "/discover/:path*",
        "/profile/:path*",
        "/applications/:path*",
        "/api/profile/:path*",
        // basic protection for data APIs
    ],
};
