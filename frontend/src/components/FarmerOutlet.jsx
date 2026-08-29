import { Navigate, Outlet } from "react-router-dom";
import { getRole } from "../utils/auth";

function FarmerOutlet() {
  const role = getRole();

  if (role !== "FARMER") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

export default FarmerOutlet;
