export function LogoutButton() {
  return (
    <form action="/logout" method="post">
      <button className="btn secondary" type="submit">
        Logout
      </button>
    </form>
  );
}
