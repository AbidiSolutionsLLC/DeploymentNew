import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Loader from "./ui/Loader";
import { usePermission } from "../hooks/usePermission";

const PrivateRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const { hasPermission } = usePermission();

  if (loading) {
    return <Loader fullPage text="Checking session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/people/home" replace />;
  }

  return children;
};

export default PrivateRoute;
