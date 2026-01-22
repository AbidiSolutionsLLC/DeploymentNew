// import React, { useRef, useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { toast } from "react-toastify";
// import { useDispatch, useSelector } from "react-redux";
// import { verifyOtp } from "../../slices/authSlice";

// const VerifyOtp = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const dispatch = useDispatch();

//   const { pendingVerification, verificationEmail, loading } = useSelector(
//     (state) => state.auth
//   );
//   const email = verificationEmail || location?.state?.email;

//   const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const inputRefs = useRef([]);

//   useEffect(() => {
//     if (!email && !pendingVerification) {
//       toast.error("Session expired. Please login again.");
//       navigate("/auth/login");
//     }
//   }, [email, pendingVerification, navigate]);

//   const handleChange = (e, index) => {
//     const { value } = e.target;
//     if (/^[0-9]?$/.test(value)) {
//       const newOtp = [...otpValues];
//       newOtp[index] = value;
//       setOtpValues(newOtp);
//       if (value && index < otpValues.length - 1) {
//         inputRefs.current[index + 1].focus();
//       }
//     }
//   };

//   const handleKeyDown = (e, index) => {
//     if (e.key === "Backspace" && !otpValues[index] && index > 0) {
//       inputRefs.current[index - 1].focus();
//     }
//   };

//   const handlePaste = (e) => {
//     e.preventDefault();
//     const pasteData = e.clipboardData.getData("text").trim();
//     if (/^\d{6}$/.test(pasteData)) {
//       const newOtp = pasteData.split("");
//       setOtpValues(newOtp);
//       inputRefs.current[otpValues.length - 1].focus();
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const otp = otpValues.join("");

//     if (otp.length !== otpValues.length) {
//       setErrorMsg("Please enter all 6 digits of the OTP.");
//       return;
//     }

//     if (isSubmitting) return;

//     try {
//       setIsSubmitting(true);
//       setErrorMsg("");

//       const resultAction = await dispatch(
//         verifyOtp({
//           email,
//           otp,
//           _verifyOtp: true,
//         })
//       );

//       if (verifyOtp.fulfilled.match(resultAction)) {
//         toast.success("OTP verified successfully!");
//         setTimeout(() => navigate("/people"), 300);
//       } else {
//         const errorMessage = resultAction.payload?.message || "Invalid OTP. Please try again.";
//         setErrorMsg(errorMessage);
//         toast.error(errorMessage);
//       }
//     } catch (error) {
//       const errorMessage = "Verification failed. Please try again.";
//       setErrorMsg(errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };;

//   return (
//     <div
//       className="flex items-center justify-center min-h-screen bg-[#274744] px-4 w-full bg-no-repeat bg-cover bg-center"
//       style={{
//         backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 560'%3E%3Cg fill='none'%3E%3Crect width='1440' height='560' fill='%23154360'/%3E%3Cpath d='M0,436.541C103.565,447.583,212.964,523.643,303.953,472.961C394.296,422.639,377.53,285.398,430.645,196.669C493.253,92.082,654.196,28.96,642.365,-92.358C630.688,-212.093,472.275,-252.285,379.405,-328.757C303.515,-391.247,238.141,-463.709,146.91,-500.331C48.933,-539.66,-55.561,-559.918,-160.124,-545.331C-275.788,-529.196,-393.142,-494.606,-476.973,-413.299C-564.136,-328.76,-619.294,-211.482,-629.122,-90.454C-638.677,27.212,-599.445,146.523,-530.195,242.132C-467.305,328.961,-365.631,375.395,-264.972,412.304C-179.98,443.469,-90.016,426.944,0,436.541' fill='%230f2e42'/%3E%3Cpath d='M1440 1073.273C1545.372 1078.74 1650.319 1078.863 1748.314 1039.746C1861.051 994.744 1984.829 942.151 2039.715 833.881C2095.009 724.805 2056.621 594.812 2034.872 474.47C2013.832 358.048 2009.268 220.212 1915.72 147.786C1822.471 75.592 1686.966 134.476 1570.645 115.063C1472.835 98.74 1383.443 15.411 1288.213 43.062C1192.96 70.72 1164.449 191.732 1088.187 255.152C990.756 336.176 832.25 349.476 780.605 465.193C728.256 582.488 754.837 733.742 827.242 839.837C897.378 942.607 1035.312 964.491 1151.583 1008.785C1245.545 1044.58 1339.586 1068.063 1440 1073.273' fill='%231c587e'/%3E%3C/g%3E%3C/svg%3E")`,
//       }}
//     >
//       <form
//         onSubmit={handleSubmit}
//         className="my-4 w-full sm:min-w-[400px] max-w-md bg-white bg-opacity-10 backdrop-blur-md p-6 sm:p-4 rounded-xl shadow-md"
//         disabled={isSubmitting}
//       >
//         <div className="flex justify-center mb-4">
//           <img
//             src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
//             alt="user"
//             className="w-16 h-16 rounded-full bg-white p-1"
//           />
//         </div>

//         <h2 className="text-white text-2xl font-semibold border-b-2 border-orange-500 w-fit mx-auto">
//           Verify OTP
//         </h2>
//         <p className="text-sm text-center text-gray-100 mb-5 mt-5">
//           Enter the 6-digit code sent to your email
//         </p>

//         {errorMsg && (
//           <p className="text-red-500 text-sm text-center mb-4">{errorMsg}</p>
//         )}

//         <div className="flex justify-between flex-wrap gap-2 sm:gap-4 mb-6">
//           {otpValues.map((digit, index) => (
//             <input
//               key={index}
//               ref={(el) => (inputRefs.current[index] = el)}
//               type="text"
//               maxLength="1"
//               value={digit}
//               onChange={(e) => handleChange(e, index)}
//               onKeyDown={(e) => handleKeyDown(e, index)}
//               onPaste={handlePaste}
//               className="w-10 h-10 sm:w-12 sm:h-12 text-center text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
//             />
//           ))}
//         </div>

//         <button
//           type="submit"
//           className="w-full bg-orange-400 hover:bg-orange-500 py-2 rounded text-orange-950 font-semibold transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-10"
//           disabled={loading || isSubmitting}
//         >
//           {loading || isSubmitting ? "Verifying..." : "Verify"}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default VerifyOtp;
