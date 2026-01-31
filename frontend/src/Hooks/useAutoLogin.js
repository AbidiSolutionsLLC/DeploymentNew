import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { syncAzureUser } from "../slices/authSlice";

const useAutoLogin = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const hasChecked = useRef(false); // Prevents double-firing in Strict Mode

  useEffect(() => {
    // 1. If Redux already knows we are logged in, do nothing.
    if (isAuthenticated || user) return;

    // 2. If we haven't checked yet, try to fetch the user from the backend
    if (!hasChecked.current) {
      hasChecked.current = true;
      
      // This hits the '/auth/me' endpoint. 
      // If the browser has a valid cookie/token, it restores the session.
      dispatch(syncAzureUser())
        .unwrap()
        .then(() => {
          console.log("✅ Session restored successfully");
        })
        .catch((err) => {
          console.log("ℹ️ No active session found (User needs to login)");
        });
    }
  }, [dispatch, isAuthenticated, user]);
};

export default useAutoLogin;