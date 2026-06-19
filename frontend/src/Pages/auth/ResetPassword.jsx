// import React, { useEffect, useState } from "react";
// import { useForm } from "react-hook-form";
// import { toast } from "react-toastify";
// import { useNavigate, useParams } from "react-router-dom";
// import api from "../../axios";
 
// const ResetPassword = () => {
//   const { token } = useParams();
//   const navigate = useNavigate();
//   const [isValidToken, setIsValidToken] = useState(false);
 
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     watch,
//   } = useForm();
 
//   const passwordRegex =
//     /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
 
// useEffect(() => {
//   const verifyToken = async () => {
//     try {
//       const decodedToken = decodeURIComponent(token);
//       await api.get(`/auth/verify-reset-token/${decodedToken}`);
//       setIsValidToken(true);
//     } catch (err) {
//       console.error('Token verification error:', err);
//       toast.error("Invalid or expired reset link.");
//       navigate("/auth/login");
//     }
//   };
//   verifyToken();
// }, [token, navigate]);
 
//   const onSubmit = async ({ password }) => {
//     try {
//       await api.post(`/auth/reset-password/${token}`, { password });
//       toast.success("Password reset successful! Redirecting...");
//       setTimeout(() => navigate("/auth/login"), 3000);
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Password reset failed.");
//     }
//   };
 
//   return (
//     <div
//       className="flex items-center justify-center min-h-screen bg-[#274744] px-4 w-full bg-no-repeat bg-cover bg-center"
//       style={{
//         backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 560'%3E%3Cg fill='none'%3E%3Crect width='1440' height='560' fill='%23154360'/%3E%3Cpath d='M0,436.541C103.565,447.583,212.964,523.643,303.953,472.961C394.296,422.639,377.53,285.398,430.645,196.669C493.253,92.082,654.196,28.96,642.365,-92.358C630.688,-212.093,472.275,-252.285,379.405,-328.757C303.515,-391.247,238.141,-463.709,146.91,-500.331C48.933,-539.66,-55.561,-559.918,-160.124,-545.331C-275.788,-529.196,-393.142,-494.606,-476.973,-413.299C-564.136,-328.76,-619.294,-211.482,-629.122,-90.454C-638.677,27.212,-599.445,146.523,-530.195,242.132C-467.305,328.961,-365.631,375.395,-264.972,412.304C-179.98,443.469,-90.016,426.944,0,436.541' fill='%230f2e42'/%3E%3Cpath d='M1440 1073.273C1545.372 1078.74 1650.319 1078.863 1748.314 1039.746C1861.051 994.744 1984.829 942.151 2039.715 833.881C2095.009 724.805 2056.621 594.812 2034.872 474.47C2013.832 358.048 2009.268 220.212 1915.72 147.786C1822.471 75.592 1686.966 134.476 1570.645 115.063C1472.835 98.74 1383.443 15.411 1288.213 43.062C1192.96 70.72 1164.449 191.732 1088.187 255.152C990.756 336.176 832.25 349.476 780.605 465.193C728.256 582.488 754.837 733.742 827.242 839.837C897.378 942.607 1035.312 964.491 1151.583 1008.785C1245.545 1044.58 1339.586 1068.063 1440 1073.273' fill='%231c587e'/%3E%3C/g%3E%3C/svg%3E")`
//       }}
//     >
//       <form
//         onSubmit={handleSubmit(onSubmit)}
//         className="w-full sm:min-w-[400px] max-w-md bg-white bg-opacity-10 backdrop-blur-md p-6 sm:p-4 rounded-xl shadow-md"
//       >
//         <div className="flex justify-center mb-4">
//           <img
//             src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
//             alt="user"
//             className="w-16 h-16 rounded-full bg-white p-1"
//           />
//         </div>
 
//         <h2 className="text-white text-2xl font-semibold border-b-2 border-orange-500 w-fit mx-auto mb-4">
//           Reset Password
//         </h2>
 
//         {/* Password Field */}
//         <div className="relative w-full mb-4">
//           <label htmlFor="password" className="block text-white mb-1">
//             New Password:
//           </label>
//           <input
//             type="password"
//             {...register("password", {
//               required: "Password is required",
//               pattern: {
//                 value: passwordRegex,
//                 message:
//                   "Must be 8+ chars, 1 uppercase, 1 number & 1 special char.",
//               },
//             })}
//             className="w-full p-2 pr-10 rounded bg-gray-300"
//           />
//           {errors.password && (
//             <p className="text-red-500 text-sm mb-3">
//               {errors.password.message}
//             </p>
//           )}
//         </div>
 
//         {/* Confirm Password Field */}
//         <div className="relative w-full mb-4">
//           <label htmlFor="confirmPassword" className="block text-white mb-1">
//             Confirm Password:
//           </label>
//           <input
//             type="password"
//             {...register("confirmPassword", {
//               required: "Confirm password is required",
//               validate: (value) =>
//                 value === watch("password") || "Passwords do not match",
//             })}
//             className="w-full p-2 pr-10 rounded bg-gray-300"
//           />
//           {errors.confirmPassword && (
//             <p className="text-red-500 text-sm mb-3">
//               {errors.confirmPassword.message}
//             </p>
//           )}
//         </div>
 
//         <button
//           type="submit"
//           className="w-full bg-orange-400 hover:bg-orange-500 py-2 rounded text-orange-950 font-semibold transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-100"
//           disabled={!isValidToken}
//         >
//           Reset Password
//         </button>
//       </form>
//     </div>
//   );
// };
 
// export default ResetPassword;
 