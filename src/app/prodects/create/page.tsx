import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/session";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function CreateProdectPage({ searchParams }: Props) {
  const session = await getSessionFromCookies();
  if (!session?.simple_auth) {
    redirect("/login");
  }

  const params = await searchParams;

  return (
    <main className="container" style={{ maxWidth: "760px" }}>
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>Create Prodect</h1>
        {params.error ? <p className="error">{params.error}</p> : null}

        <form action="/prodects" method="post" className="form-grid" encType="multipart/form-data">
          <label>
            Name
            <input name="name" type="text" required maxLength={255} />
          </label>

          <label>
            Descripshin
            <textarea name="descripshin" required />
          </label>

          <label>
            Price
            <input name="price" type="number" step="0.01" required />
          </label>

          <label>
            Image
            <input name="image" type="file" accept=".jpg,.jpeg,.png,.webp" required />
          </label>

          <div className="row-actions">
            <button className="btn" type="submit">
              Save
            </button>
            <Link href="/ProdectWebController" className="btn secondary">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
