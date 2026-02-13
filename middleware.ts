export { default } from "next-auth/middleware";

export const config = {
  // Protect all /admin routes except the login page itself
  matcher: ["/admin/:path+"],
};
