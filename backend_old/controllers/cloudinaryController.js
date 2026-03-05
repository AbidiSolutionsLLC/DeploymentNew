// // controllers/cloudinary.controller.js
// const cloudinary = require('../config/cloudinaryConfig');

// exports.signUpload = (req, res) => {
//   const { folderPath, publicIdBase } = req.body;
//   try{
//   console.log(folderPath,"hello"+publicIdBase)
//   const timestamp = Math.floor(Date.now()/1000);
//   const paramsToSign = {
//     folder:    folderPath,
//     timestamp,
//     public_id: `${publicIdBase}-${timestamp}`
//   };
//   const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);
//   res.json({ 
//     apiKey:    process.env.CLOUDINARY_API_KEY,
//     signature, timestamp,
//     folder:    folderPath,
//     public_id: paramsToSign.public_id
//   });
//   }
//   catch(err){
//   console.log(err,"error uploading file")
// }
// };
