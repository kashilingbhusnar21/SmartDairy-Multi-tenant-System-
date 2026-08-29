import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../utils/auth";

function ProtectedOutlet() {
  const token = getToken();
  console.log("ProtectedOutlet - Token check:", token ? "EXISTS" : "NULL");

  if (!token) {
    console.log("ProtectedOutlet - No token, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  console.log("ProtectedOutlet - Token exists, rendering Outlet");
  return <Outlet />;
}

export default ProtectedOutlet;
