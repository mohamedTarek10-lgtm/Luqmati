export function ProfileAvatarIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 88 88"
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <g fill="currentColor">
        <circle cx="44" cy="20" r="12" />
        <path d="M28 47c0-8.8 7.2-16 16-16s16 7.2 16 16v8H28v-8Zm-3 20c2.8-8.2 10.1-13 19-13s16.2 4.8 19 13v8H25v-8Z" />
      </g>
    </svg>
  );
}

import Image from "next/image";

export function ProfileAvatarBadge({ size = 42, className = "", src = null }) {
  // If a src is provided (from Clerk user), render the image. Fall back to
  // the SVG avatar icons preserving original styling.
  if (src) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "9999px",
          background: "var(--surface)",
          color: "var(--foreground)",
          display: "grid",
          placeItems: "center",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 8px 18px rgba(0, 0, 0, 0.12)",
          overflow: "hidden",
        }}
      >
        <Image
          src={src}
          alt="Profile"
          width={size}
          height={size}
          unoptimized
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: "var(--surface)",
        color: "var(--foreground)",
        display: "grid",
        placeItems: "center",
        border: "1px solid var(--glass-border)",
        boxShadow: "0 8px 18px rgba(0, 0, 0, 0.12)",
        overflow: "hidden",
      }}
    >
      <ProfileAvatarIcon className="profile-avatar-icon" />
    </div>
  );
}
