"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, Show, useUser } from "@clerk/nextjs";
import ThemeToggle from "./theme-toggle";
import { useLang } from "../hooks/i18n-context";
import { ProfileAvatarBadge } from "./profile-avatar";
import { isAdminClientUser } from "../lib/auth/isAdminClient";

export function HeaderNav({ isAdmin = false }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { lang, t, toggleLang } = useLang();
  const effectiveIsAdmin = isAdmin || isAdminClientUser(user);

  const navLinkStyle = (path) => ({
    fontSize: "14px",
    fontWeight: pathname === path ? 700 : 500,
    color: pathname === path ? "var(--brand)" : "var(--text-secondary)",
    textDecoration: "none",
    transition: "color 0.2s",
  });

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header mobile-only">
        <Link href="/" className="mobile-brand" aria-label="Luqmati لقمتي" style={{ textDecoration: "none" }}>
          <span className="font-arabic">لقمتي</span>
          <span className="english-font">Luqmati</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="lang-toggle"
            onClick={toggleLang}
            title={lang === "ar" ? "English" : "عربي"}
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          <ThemeToggle />
          <Link href="/profile" aria-label="Profile" style={{ display: "inline-flex" }}>
            <ProfileAvatarBadge size={36} src={user?.profileImageUrl || user?.imageUrl || user?.profile_image_url} />
          </Link>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="desktop-nav">
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span className="font-arabic" style={{ fontSize: "26px", fontWeight: 700, color: "var(--brand)" }}>
            لقمتي
          </span>
          <span className="english-font" style={{ fontSize: "20px", fontWeight: 600, color: "var(--brand)", letterSpacing: "-0.5px" }}>
            Luqmati
          </span>
        </Link>

        <nav style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <Link href="/" style={navLinkStyle("/")}>{t.home}</Link>
          <Link href="/history" style={navLinkStyle("/history")}>{t.history}</Link>
          <Link href="/profile" style={navLinkStyle("/profile")}>{t.profile}</Link>
          {effectiveIsAdmin ? <Link href="/admin" style={navLinkStyle("/admin")}>Admin</Link> : null}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="lang-toggle"
            onClick={toggleLang}
            title={lang === "ar" ? "English" : "عربي"}
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          <ThemeToggle />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                style={{
                  padding: "7px 16px",
                  borderRadius: "10px",
                  border: "1.5px solid var(--glass-border)",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {t.signIn}
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-primary" style={{ padding: "7px 16px", fontSize: "13px" }}>
                {t.signUp}
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/profile" aria-label="Profile" style={{ display: "inline-flex" }}>
              <ProfileAvatarBadge size={36} src={user?.profileImageUrl || user?.imageUrl || user?.profile_image_url} />
            </Link>
          </Show>
        </div>
      </header>
    </>
  );
}

export function FooterBranding() {
  return (
    <footer className="site-footer" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "28px 16px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px", flexWrap: "wrap", justifyContent: "center" }}>
        <span>© {new Date().getFullYear()} لقمتي / Luqmati</span>
        <span>·</span>
        <Link href="/privacy" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          سياسة الخصوصية
        </Link>
        <span>·</span>
        <Link href="/terms" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
          شروط الاستخدام
        </Link>
        <span>·</span>
        <a
          href="https://github.com/mohamedTarek10-lgtm"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-mt"
          title="Created by MT"
          aria-label="MT Developer Signature"
        >
          MT
        </a>
      </div>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", maxWidth: "460px", margin: 0, lineHeight: 1.5 }}>
        ⚠️ جميع الحسابات استرشادية ولا تغني عن الاستشارة الطبية المتخصصة.
      </p>
    </footer>
  );
}
