// import { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { silentRefresh } from '../slices/authSlice';

// let isCheckingAuth = false;

// const useAutoLogin = () => {
//   const dispatch = useDispatch();
//   const { isAuthenticated } = useSelector((state) => state.auth);

//   useEffect(() => {
//     if (isAuthenticated || isCheckingAuth) {
//       return;
//     }

//     const checkAuth = async () => {
//       try {
//         isCheckingAuth = true;
//         await dispatch(silentRefresh());
//       } catch (error) {
//         console.error("Auto login failed:", error);
//       } finally {
//         isCheckingAuth = false;
//       }
//     };

//     checkAuth();
//   }, [dispatch, isAuthenticated]);
// };

// export default useAutoLogin;
