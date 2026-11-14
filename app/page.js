import HomeClient from "../components/home/home-client";
import HomeGuidance from "../components/home/home-guidance";
import { HOME_CONTENT } from "../lib/home-content";

// This route intentionally does no auth() work, so the shell is prerendered
// and served from the CDN. Signed-in data loads inside the client island.
export default function HomePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_CONTENT.ar.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <HomeClient />
      <HomeGuidance />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
