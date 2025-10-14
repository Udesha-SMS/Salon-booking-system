const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: "duiclrgeg",
  api_key: "668668572745842",
  api_secret: "5QhQH8NqPbk3SvnKBrsfKiV3XPM", // Replace with your actual API secret
});

module.exports = cloudinary;

