"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  prodect: {
    id: number;
    name: string;
    descripshin: string;
    price: string;
    image: string | null;
  };
};

export function ProdectEditForm({ prodect }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/prodects/${prodect.id}`, {
      method: "PUT",
      body: formData
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? "Unexpected server error.");
      setLoading(false);
      return;
    }

    router.push("/ProdectWebController");
    router.refresh();
  }

  return (
    <form className="form-grid" onSubmit={onSubmit} encType="multipart/form-data">
      {prodect.image ? (
        <div>
          <p className="muted" style={{ marginBottom: "0.5rem" }}>
            Current image
          </p>
          <Image
            src={`/uploads/${prodect.image}`}
            alt={prodect.name}
            width={220}
            height={150}
            style={{ borderRadius: "8px", objectFit: "cover", width: "220px", height: "150px" }}
          />
        </div>
      ) : null}

      <label>
        Name
        <input name="name" type="text" defaultValue={prodect.name} required />
      </label>

      <label>
        Descripshin
        <textarea name="descripshin" defaultValue={prodect.descripshin} required />
      </label>

      <label>
        Price
        <input name="price" type="number" step="0.01" defaultValue={prodect.price} required />
      </label>

      <label>
        Image (optional)
        <input name="image" type="file" accept=".jpg,.jpeg,.png,.webp" />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <div className="row-actions">
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <Link className="btn secondary" href="/ProdectWebController">
          Cancel
        </Link>
      </div>
    </form>
  );
}
