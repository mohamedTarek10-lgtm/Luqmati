// The page itself is a client component, so its canonical URL is declared here.
// Inheriting the root layout's "/" would tell crawlers this page is the home page.
export const metadata = {
  alternates: { canonical: "/terms" },
};

export default function TermsLayout({ children }) {
  return children;
}
