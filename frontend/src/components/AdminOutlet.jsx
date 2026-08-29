import { Navigate, Outlet } from "react-router-dom";
import { getRole } from "../utils/auth";

function AdminOutlet() {
  const role = getRole();
  console.log("AdminOutlet - Role check:", role);

  if (role !== "ADMIN") {
    console.log("AdminOutlet - Role is not ADMIN, redirecting to /farmer/dashboard");
    return <Navigate to="/farmer/dashboard" replace />;
  }

  console.log("AdminOutlet - Role is ADMIN, rendering Outlet");
  return <Outlet />;
}

export default AdminOutlet;
