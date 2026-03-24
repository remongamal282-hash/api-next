import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { ProdectDeleteButton } from "@/components/prodect-delete-button";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";

type Props = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function ProdectWebControllerPage({ searchParams }: Props) {
  const session = await getSessionFromCookies();
  if (!session?.simple_auth) {
    redirect("/login");
  }

  const params = await searchParams;
  const prodects = await prisma.prodects.findMany({
    orderBy: { created_at: "desc" }
  });

  return (
    <main className="container">
      <section className="panel">
        <header className="topbar">
          <div>
            <h1 style={{ margin: 0 }}>Prodect Dashboard</h1>
            <p className="muted" style={{ marginBottom: 0 }}>
              Logged in as {session.simple_auth_user}
            </p>
          </div>
          <div className="row-actions">
            <Link href="/prodects/create" className="btn">
              Create Prodect
            </Link>
            <LogoutButton />
          </div>
        </header>

        {params.success ? <p className="success">{params.success}</p> : null}
        {params.error ? <p className="error">{params.error}</p> : null}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Descripshin</th>
              <th>Price</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prodects.map((prodect) => (
              <tr key={prodect.id}>
                <td>{prodect.id}</td>
                <td>{prodect.name}</td>
                <td>{prodect.descripshin}</td>
                <td>{prodect.price.toString()}</td>
                <td>{prodect.image ? <code>{prodect.image}</code> : "-"}</td>
                <td>
                  <div className="row-actions">
                    <Link href={`/prodects/${prodect.id}/edit`} className="btn secondary">
                      Edit
                    </Link>
                    <ProdectDeleteButton id={prodect.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
