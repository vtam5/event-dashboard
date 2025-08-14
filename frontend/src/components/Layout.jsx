import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div>
      <nav style={{ padding: "10px", background: "#f0f0f0" }}>
        <Link to="/" style={{ marginRight: "10px" }}>Public Events</Link>
        <Link to="/admin">Admin Dashboard</Link>
      </nav>
      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
}
