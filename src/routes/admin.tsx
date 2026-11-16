import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LibraryFrame } from "@/components/library-frame";

export const Route = createFileRoute("/admin")({ component: AdminRoute });

function AdminRoute() {
  return <><LibraryFrame initialHash="#/admin" /><Outlet /></>;
}
