"use client";

import Link from "next/link";
import { useLang } from "@/hooks/i18n-context";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";

export default function PrivacyPage() {
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
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔒</div>
          <h1
            className="font-arabic"
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginBottom: "28px",
            }}
          >
            {isAr
              ? `آخر تحديث: ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}`
              : `Last Updated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}`}
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
                {isAr ? "١. التزامنا بخصوصيتك" : "1. Our Commitment"}
              </h2>
              <p>
                {isAr
                  ? "نحن في تطبيق «لقمتي» نقدر خصوصية بياناتك ومعلوماتك الصحية. هذه السياسة توضح بشفافية تامة البيانات التي نجمعها، وكيف نستخدمها، وحقك الكامل في التحكم بها وحذفها في أي وقت."
                  : "At Luqmati, we treat your privacy and health data with the utmost respect. This policy explains what information we collect, how we process it, and your full right to control or delete it at any time."}
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
                {isAr ? "٢. البيانات التي نجمعها" : "2. Information We Collect"}
              </h2>
              <ul style={{ paddingInlineStart: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>
                  <strong>{isAr ? "صور الأكل ووصف الوجبات: " : "Meal Photos & Descriptions: "}</strong>
                  {isAr
                    ? "الصور أو الأوصاف التي تلتقطها أو تكتبها تُستخدم فقط لتحليل السعرات والماكروز بواسطة نماذج الذكاء الاصطناعي."
                    : "Photos and text descriptions you submit are used solely to extract nutritional estimates via AI vision models."}
                </li>
                <li>
                  <strong>{isAr ? "بيانات الحساب: " : "Account Information: "}</strong>
                  {isAr
                    ? "عند تسجيل الدخول عبر Clerk، نحتفظ بمعرف المستخدم (User ID) والبريد الإلكتروني للربط بسجل وجباتك."
                    : "When signing in with Clerk, we securely link your unique User ID and email to your meal history."}
                </li>
                <li>
                  <strong>{isAr ? "أهدافك الغذائية: " : "Nutritional Targets: "}</strong>
                  {isAr
                    ? "أهداف السعرات والبروتين والكربوهيدرات والدهون التي تحددها في صفحتك لحساب تقدمك اليومي."
                    : "Calorie and macronutrient goals you set in your profile to track daily progress."}
                </li>
              </ul>
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
                {isAr ? "٣. معالجة الصور بالذكاء الاصطناعي" : "3. AI Image Processing"}
              </h2>
              <p>
                {isAr
                  ? "تتم معالجة وضغط الصور على جهازك أولاً لتقليل حجمها، ثم تُرسل عبر اتصال مشفر وآمن (HTTPS/SSL) لواجهة الذكاء الاصطناعي. لا نبيع صورك أو نستخدمها لتدريب أطراف ثالثة تجارية دون إذنك."
                  : "Images are compressed locally on your device to protect bandwidth, then sent via encrypted HTTPS to AI inference providers. We do not sell your meal data to third-party advertisers."}
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
                {isAr ? "٤. حقك في حذف البيانات" : "4. Data Control & Deletion"}
              </h2>
              <p>
                {isAr
                  ? "لك كامل الصلاحية في حذف أي وجبة منفردة أو مسح كامل سجل الوجبات في أي وقت بضغطة زر واحدة من صفحة «السجل»، وسيتم إزالتها نهائياً وفوراً من قاعدة بياناتنا."
                  : "You maintain complete ownership of your history. You can delete individual meals or clear your entire history with one click from the History page at any time."}
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
                {isAr ? "٥. ملفات تعريف الارتباط (Cookies)" : "5. Storage & Cookies"}
              </h2>
              <p>
                {isAr
                  ? "نستخدم ملفات التخزين المحلي (LocalStorage) لتخزين تفضيلات الثيم (المظلم/الفاتح)، وتخزين الوجبات السابقة للعمل أوفلاين (PWA Offline Mode)، وإدارة الجلسات الآمنة."
                  : "We use browser LocalStorage and secure cookies strictly for theme preferences, PWA offline caching, and secure session management."}
              </p>
            </section>
          </div>

          <MedicalDisclaimer lang={lang} />
        </div>
      </div>
    </main>
  );
}
