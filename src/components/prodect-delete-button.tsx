"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: number;
};

export function ProdectDeleteButton({ id }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const ok = window.confirm("Are you sure you want to delete this prodect?");
    if (!ok) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/prodects/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? "Unexpected server error.");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn danger" type="button" onClick={handleDelete} disabled={loading}>
        {loading ? "Deleting..." : "Delete"}
      </button>
      {error ? <div className="error">{error}</div> : null}
    </div>
  );
}
