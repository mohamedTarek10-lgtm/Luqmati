import { auth, clerkClient } from "@clerk/nextjs/server";
import { isAdminClientUser } from "./isAdminClient";

export { isAdminClientUser };

export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getAdminEmails().includes(normalized);
}

/**
 * Server-side helper to check if the current auth context is an admin
 */
export async function isAdminUser(authContext = null) {
  const currentAuth = authContext ?? (await auth());
  const sessionClaims = currentAuth?.sessionClaims || {};

  // 1. Check session claims role if set
  if (sessionClaims.role === "admin" || sessionClaims.metadata?.role === "admin") {
    return true;
  }

  // 2. Check session claims email
  const emailFromClaims = sessionClaims.email || sessionClaims.primaryEmail || sessionClaims.emailAddress || "";
  if (isAdminEmail(emailFromClaims)) {
    return true;
  }

  const userId = currentAuth?.userId;
  if (!userId) return false;

  // 3. Fallback: fetch user from Clerk API
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    if (user?.publicMetadata?.role === "admin") {
      return true;
    }

    const emails = [];
    if (user?.emailAddresses) {
      user.emailAddresses.forEach((item) => {
        if (item?.emailAddress) {
          emails.push(item.emailAddress);
        }
      });
    }

    return emails.some((email) => isAdminEmail(email));
  } catch (error) {
    console.warn("[Luqmati] Could not resolve admin email from Clerk user.", error);
  }

  return false;
}
