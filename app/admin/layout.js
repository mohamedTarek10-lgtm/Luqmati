import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/auth/isAdmin";

// Admin gating lives here instead of the root layout: a root-level auth() call
// forced every route to render dynamically and hit the Clerk API per request.
export const metadata = {
  title: "لوحة التحليلات",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  const currentAuth = await auth();
  if (!currentAuth.userId) redirect("/");

  const isAllowed = await isAdminUser(currentAuth);
  if (!isAllowed) redirect("/");

  return children;
}
