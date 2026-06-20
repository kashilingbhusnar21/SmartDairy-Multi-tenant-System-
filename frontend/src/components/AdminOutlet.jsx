import { Navigate, Outlet } from "react-router-dom";
import { getRole, isAuthenticated } from "../utils/auth";

function AdminOutlet() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (getRole() !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}

export default AdminOutlet;
