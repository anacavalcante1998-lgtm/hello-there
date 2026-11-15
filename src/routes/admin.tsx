import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "../components/admin/admin-shell";

export const Route = createFileRoute("/admin")({ component: AdminRoute });

function AdminRoute() {
  return <AdminShell><Outlet /></AdminShell>;
}
