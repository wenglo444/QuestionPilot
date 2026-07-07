import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // Allow access to the landing page and login
      const path = req.nextUrl.pathname;
      if (path === "/" || path.startsWith("/login")) {
        return true;
      }
      // Require auth for all other routes
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
