import { notFound, redirect } from "next/navigation";
import { ProdectEditForm } from "@/components/prodect-edit-form";
import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/session";
import { isUuidV4 } from "@/utils/uuid";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProdectPage({ params }: Props) {
  const session = await getSessionFromCookies();
  if (!session?.simple_auth) {
    redirect("/login");
  }

  const { id } = await params;
  if (!isUuidV4(id)) {
    notFound();
  }

  const prodect = await prisma.prodects.findUnique({ where: { id } });
  if (!prodect) {
    notFound();
  }

  return (
    <main className="container" style={{ maxWidth: "760px" }}>
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>Edit Prodect #{prodect.id}</h1>
        <ProdectEditForm
          prodect={{
            id: prodect.id,
            name: prodect.name,
            descripshin: prodect.descripshin,
            price: prodect.price.toString(),
            image: prodect.image
          }}
        />
      </section>
    </main>
  );
}
