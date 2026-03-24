import { getSessionFromCookies } from "@/lib/session";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSessionFromCookies();
  if (session?.simple_auth) {
    redirect("/ProdectWebController");
  }

  const params = await searchParams;
  const error = params.error ?? "";

  return (
    <main className="container" style={{ maxWidth: "520px" }}>
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>Login</h1>
        <p className="muted">Use username (name) or email + password.</p>
        {error ? <p className="error">{error}</p> : null}
        <form action="/api/login" method="post" className="form-grid">
          <label>
            Username
            <input type="text" name="username" required />
          </label>

          <label>
            Password
            <input type="password" name="password" required />
          </label>

          <button className="btn" type="submit">
            Login
          </button>
        </form>
      </section>
    </main>
  );
}
