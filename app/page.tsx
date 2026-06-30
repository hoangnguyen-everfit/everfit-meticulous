import Link from "next/link";

export default function HomePage() {
  return (
    <section>
      <h1>Meticulous Demo</h1>
      <p>
        A sandbox to try out the Meticulous workflow: record sessions locally
        (Phase A) and run tests via Docker on CI (Phase B).
      </p>
      <p>User flows to click through and generate sessions:</p>
      <ul>
        <li>
          <Link href="/login" data-testid="link-login-home">
            Login (form input)
          </Link>
        </li>
        <li>
          <Link href="/dashboard" data-testid="link-dashboard-home">
            Dashboard (calls API, add/remove items)
          </Link>
        </li>
      </ul>
    </section>
  );
}
