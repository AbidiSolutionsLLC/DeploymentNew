// PublicRoute.jsx - Improved version
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import Loader from "./ui/Loader";

const PublicRoute = ({ children }) => {
 const { isAuthenticated } = useSelector((state) => state.auth);
 const location = useLocation();

 return isAuthenticated ? 
 <Navigate to={location.state?.from || "/people/home"} replace /> 
 : children;
};

export default PublicRoute;