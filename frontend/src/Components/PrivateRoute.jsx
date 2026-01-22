import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
      <Spin size="large" tip="Loading..." />
    </div>;
  }

  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
};

export default PrivateRoute;
