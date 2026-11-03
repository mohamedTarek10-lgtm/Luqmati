export function getAdminEmailsClient() {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmailClient(email) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getAdminEmailsClient().includes(normalized);
}

export function isAdminClientUser(user) {
  if (!user) return false;

  if (user.publicMetadata?.role === "admin") {
    return true;
  }

  const emails = [];
  if (user.primaryEmailAddress?.emailAddress) {
    emails.push(user.primaryEmailAddress.emailAddress);
  }
  if (Array.isArray(user.emailAddresses)) {
    user.emailAddresses.forEach((item) => {
      if (item?.emailAddress) {
        emails.push(item.emailAddress);
      }
    });
  }

  return emails.some((email) => isAdminEmailClient(email));
}

