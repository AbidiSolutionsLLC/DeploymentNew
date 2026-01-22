// import { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { silentRefresh } from "../slices/authSlice";

// const useTokenRefresh = () => {
//   const dispatch = useDispatch();
//   const { isAuthenticated, token } = useSelector((state) => state.auth);

// useEffect(() => {
//   if (!isAuthenticated || !token) return;

//   const refreshInterval = setInterval(() => {
//     dispatch(silentRefresh());
//   }, 10 * 60 * 1000);

//   return () => clearInterval(refreshInterval);
// }, [dispatch, isAuthenticated, token]);
// };

// export default useTokenRefresh;