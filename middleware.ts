export { default } from "next-auth/middleware";

export const config = {
  // Protect admin sub-routes (projects, posts, etc.)
  // The /admin page itself handles auth in its layout (shows login form)
  matcher: ["/admin/projects/:path*", "/admin/posts/:path*"],
};
