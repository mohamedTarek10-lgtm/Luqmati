"use client";

import Image from "next/image";
import { useState } from "react";

/** Standard person silhouette used by most sites as the default avatar. */
export function ProfileAvatarIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <path
        fill="currentColor"
        d="M12 12.5a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5Zm0 1.9c-4.6 0-8.35 2.6-8.35 5.8 0 .9.72 1.3 1.7 1.3h13.3c.98 0 1.7-.4 1.7-1.3 0-3.2-3.75-5.8-8.35-5.8Z"
      />
    </svg>
  );
}

export function ProfileAvatarBadge({ size = 42, className = "", src = null }) {
  // Clerk serves the avatar from the sign-in provider (e.g. the Google photo
  // on the user's email). If there is none, or it fails to load, show the
  // standard silhouette instead of an empty circle.
  // Remember which src failed, so a new avatar URL is retried automatically.
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: "var(--surface)",
        color: "var(--text-secondary)",
        display: "grid",
        placeItems: "center",
        border: "1px solid var(--glass-border)",
        boxShadow: "0 8px 18px rgba(0, 0, 0, 0.12)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {showImage ? (
        <Image
          src={src}
          alt="Profile"
          width={size}
          height={size}
          unoptimized
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            padding: size <= 40 ? "6px" : "10px",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(0,0,0,0.18))",
          }}
        >
          <ProfileAvatarIcon className="profile-avatar-icon" />
        </span>
      )}
    </div>
  );
}
