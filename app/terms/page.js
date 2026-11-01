"use client";

import Link from "next/link";
import { useLang } from "@/hooks/i18n-context";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";

export default function TermsPage() {
  const { lang, t } = useLang();
  const isAr = lang === "ar";

  return (
    <main style={{ minHeight: "85dvh", padding: "32px 16px 64px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Back Link */}
        <Link
          href="/"
          style={{
            color: "var(--brand)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "20px",
          }}
        >
          <span>{isAr ? "←" : "→"}</span>
          <span>{isAr ? "العودة للرئيسية" : "Back to Home"}</span>
        </Link>

        {/* Card */}
        <div className="glass-card fade-in" style={{ padding: "36px 28px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📜</div>
          <h1
            className="font-arabic"
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            {isAr ? "شروط الاستخدام" : "Terms of Service"}
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginBottom: "28px",
            }}
          >
            {isAr
              ? `تاريخ السريان: ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}`
              : `Effective Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}`}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              color: "var(--text-secondary)",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            <section>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                {isAr ? "١. قبول الشروط" : "1. Acceptance of Terms"}
              </h2>
              <p>
                {isAr
                  ? "باستخدامك لتطبيق «لقمتي»، فإنك تقر وتوافق على الالتزام بهذه الشروط وبسياسة الخصوصية الخاصة بنا. إذا كنت لا توافق على أي جزء منها، يُرجى التوقف عن استخدام المنصة."
                  : "By accessing or using Luqmati, you agree to comply with and be bound by these Terms and our Privacy Policy. If you do not agree, please discontinue using the service."}
              </p>
            </section>

            <section>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                {isAr ? "٢. طبيعة الخدمة والتقديرات الحسابية" : "2. Nature of Estimates"}
              </h2>
              <p>
                {isAr
                  ? "«لقمتي» يوفر تقديرات حسابية لمكونات الأكل والسعرات والماكروز بناءً على تحليل الصور والنصوص بتقنيات الذكاء الاصطناعي وجداول التغذية للأكلات المصرية والعربية. نظراً لاختلاف طرق الطهي والمكونات والزيوت المضافة، فإن هذه الأرقام تظل تقديرية استرشادية وليست قياسات مخبرية مطلقة."
                  : "Luqmati delivers AI-estimated nutritional breakdowns based on computer vision models and local food composition tables. Variations in cooking styles, oils, and recipes mean these numbers are helpful approximations, not certified laboratory measurements."}
              </p>
            </section>

            <section>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                {isAr ? "٣. الاستخدام العادل (Fair Use)" : "3. Fair Usage Policy"}
              </h2>
              <p>
                {isAr
                  ? "يُمنح كل مستخدم حد استخدام يومي مجاني لضمان استقرار الخدمة وسرعتها لجميع المشتركين. يُحظر استخدام أي روبوتات أو برمجيات خبيثة للتحميل الزائد على السيرفرات أو تجاوز الحدود المحددة."
                  : "Users are provided with daily analysis quotas to maintain high quality and service availability for all members. Automated scraping, malicious bot traffic, or deliberate attempts to overwhelm the infrastructure are strictly prohibited."}
              </p>
            </section>

            <section>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                {isAr ? "٤. المحتوى المسؤول" : "4. User Content & Images"}
              </h2>
              <p>
                {isAr
                  ? "يتعهد المستخدم بعدم رفع أي صور غير قانونية، أو مسيئة، أو صور تنتهك حقوق الملكية الفكرية أو خصوصية الآخرين. يقتصر استخدام أداة التحليل على أطباق ومكونات الطعام والمشروبات فقط."
                  : "You agree not to upload any illegal, offensive, or non-consensual imagery. Image uploads should be restricted strictly to food dishes, meal ingredients, and dietary items."}
              </p>
            </section>
          </div>

          <MedicalDisclaimer lang={lang} />
        </div>
      </div>
    </main>
  );
}
