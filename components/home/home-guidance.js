"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLang } from "../../hooks/i18n-context";
import { HOME_CONTENT } from "../../lib/home-content";

const STORE_KEY = "luqmati-guide-hidden";
const TYPE_DELAY_MS = 55;
const listeners = new Set();
let cached = null;

function readHidden() {
  try {
    return window.localStorage.getItem(STORE_KEY) === "1";
  } catch {
    return false;
  }
}

function getSnapshot() {
  if (cached === null) cached = readHidden();
  return cached;
}

function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function writeHidden(value) {
  cached = value;
  try {
    if (value) window.localStorage.setItem(STORE_KEY, "1");
    else window.localStorage.removeItem(STORE_KEY);
  } catch {
    // Private mode: the dismissal just will not persist.
  }
  listeners.forEach((callback) => callback());
}

/** Dismissal lives in localStorage, read through useSyncExternalStore so the
 *  server render and the first client render agree. */
function useGuideHidden() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export default function HomeGuidance() {
  const { lang } = useLang();
  const content = HOME_CONTENT[lang] || HOME_CONTENT.ar;
  const guide = content.guide;
  const [open, setOpen] = useState(false);
  const labelRef = useRef(null);
  const hidden = useGuideHidden();

  // Typed letter by letter on the DOM node itself: no state churn, and the
  // full sentence stays in the server-rendered HTML for crawlers.
  useEffect(() => {
    if (hidden) return;

    const label = labelRef.current;
    if (!label) return;

    const full = guide.teaser;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reducedMotion) {
      label.textContent = full;
      return;
    }

    let index = 0;
    label.textContent = "";
    const timer = setInterval(() => {
      index += 1;
      label.textContent = full.slice(0, index);
      if (index >= full.length) clearInterval(timer);
    }, TYPE_DELAY_MS);

    return () => {
      clearInterval(timer);
      label.textContent = full;
    };
  }, [guide.teaser, hidden]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        writeHidden(true);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // The sheet lives inside .page-wrapper (a lower stacking context than the
    // bottom navigation), so the nav steps aside while it is open.
    document.body.classList.add("guide-open");

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("guide-open");
    };
  }, [open]);

  const openGuide = () => setOpen(true);

  // Once the guidance has been opened and closed, the bubble retires for good.
  // Hiding on close (not on open) means a tap that misses cannot lose the
  // entry point.
  const closeGuide = () => {
    setOpen(false);
    writeHidden(true);
  };

  return (
    <>
      {/* The panel stays in the HTML even when closed, so the copy remains
          indexable; it is only visually hidden. */}
      {open && (
        <div className="guide-backdrop" onClick={closeGuide} aria-hidden="true" />
      )}

      <div
        className={`guide-panel${open ? "" : " is-hidden"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="guide-head">
          <p id="guide-title" className="guide-title">
            {guide.title}
          </p>
          <button
            type="button"
            className="guide-close"
            onClick={closeGuide}
            aria-label={guide.close}
          >
            ✕
          </button>
        </div>

        <div className="seo-wrap">
          <section className="seo-section">
            <h3 className="seo-title">{content.howTitle}</h3>
            <ol className="seo-steps">
              {content.howSteps.map((step, index) => (
                <li key={step.title} className="seo-step">
                  <span className="seo-step-num" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="seo-step-title">{step.title}</h4>
                    <p className="seo-text">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="seo-section">
            <h3 className="seo-title">{content.featuresTitle}</h3>
            <div className="seo-grid">
              {content.features.map((feature) => (
                <div key={feature.title} className="seo-card">
                  <h4 className="seo-card-title">{feature.title}</h4>
                  <p className="seo-text">{feature.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="seo-section">
            <h3 className="seo-title">{content.examplesTitle}</h3>
            <div className="seo-grid seo-grid-examples">
              {content.examples.map((example) => (
                <div key={example.name} className="seo-card seo-example">
                  <h4 className="seo-card-title">
                    {example.name}
                    <span className="seo-example-detail">{example.detail}</span>
                  </h4>
                  <p className="seo-text seo-example-values">
                    {example.kcal} · {example.protein}
                  </p>
                </div>
              ))}
            </div>
            <p className="seo-note">{content.examplesNote}</p>
          </section>

          <section className="seo-section">
            <h3 className="seo-title">{content.faqTitle}</h3>
            <div className="seo-faq">
              {content.faq.map((item) => (
                <details key={item.q} className="seo-faq-item">
                  <summary className="seo-faq-q">{item.q}</summary>
                  <p className="seo-text">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>

      {!hidden && !open && (
        <div className="guide-root" dir={lang === "ar" ? "rtl" : "ltr"}>
          <div className="guide-orb-wrap">
            <button
              type="button"
              className="guide-orb"
              onClick={openGuide}
              aria-label={guide.title}
            >
              <span aria-hidden="true">luqmati</span>
            </button>

            <button
              type="button"
              className="guide-dismiss"
              onClick={() => writeHidden(true)}
              aria-label={guide.dismiss}
              title={guide.dismiss}
            >
              ✕
            </button>
          </div>

          <button
            type="button"
            className="guide-teaser"
            onClick={openGuide}
            aria-label={guide.title}
          >
            <span ref={labelRef} aria-hidden="true">
              {guide.teaser}
            </span>
            <span className="guide-caret" aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
