import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Loader from "./ui/Loader";

const PrivateRoute = ({ children }) => {
 const { isAuthenticated, loading } = useSelector((state) => state.auth);

 if (loading) {
 return <Loader fullPage text="Checking session..." />;
 }

 return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
};

export default PrivateRoute;
