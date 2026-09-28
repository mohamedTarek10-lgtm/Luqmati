"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MealDetailActions({ mealId }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    try {
      setDeleting(true);
      const res = await fetch(`/api/meals/${mealId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/history");
        router.refresh();
      } else {
        alert("فشل حذف الوجبة. حاول مرة أخرى.");
        setDeleting(false);
      }
    } catch {
      alert("حدث خطأ أثناء الاتصال بالسيرفر.");
      setDeleting(false);
    }
  }

  if (confirmDelete) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "13px", color: "var(--status-error)" }}>
          متأكد من حذف الوجبة؟
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: "var(--status-error)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: deleting ? "wait" : "pointer",
          }}
        >
          {deleting ? "جارٍ الحذف..." : "نعم، احذف"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(false)}
          disabled={deleting}
          className="btn-outline"
          style={{ padding: "6px 12px", fontSize: "12px", height: "auto" }}
        >
          إلغاء
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmDelete(true)}
      style={{
        background: "rgba(239, 68, 68, 0.12)",
        color: "#ef4444",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        borderRadius: "10px",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <span>🗑️</span>
      <span>حذف الوجبة من السجل</span>
    </button>
  );
}
