const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require("mongoose");
const multer = require("multer");
const path = require('path');
const fs = require('fs');
const AuthRouter = require('./Routes/AuthRouter');
const UserModel = require('./Models/User');
const authenticateJWT = require('./Middlewares/authenticateJWT'); // Import middleware

require('dotenv').config();
require('./Models/db');

const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(cors());

// Serve static files from 'public' directory
app.use(express.static('public'));
app.use('/auth', AuthRouter);

const storage = multer.memoryStorage(); // Use memory storage for multer
const upload = multer({ storage });

// Route for uploading images
app.post("/upload-image", authenticateJWT, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const base64Image = req.file.buffer.toString('base64'); // Convert the image buffer to Base64
  const imageName = `${Date.now()}-${req.file.originalname}`;

  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.images.push({ name: imageName, data: base64Image }); // Store Base64 image in the database
    await user.save();

    res.json({ status: "ok" });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Route for fetching images
app.get("/get-image", authenticateJWT, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const imageUrls = user.images.map(image => ({
      name: image.name,
      url: `data:image/jpeg;base64,${image.data}`
    }));

    res.send({ status: "ok", data: imageUrls });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// Route for downloading images (if you still need it)
app.get("/download-image/:filename", authenticateJWT, (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, "./images/", filename);
  console.log(`Filepath: ${filepath}`); // Add log to see the path being accessed
  if (fs.existsSync(filepath)) {
    res.download(filepath);
  } else {
    res.status(404).json({ message: "File not found" });
  }
});

// Route for deleting images
app.delete("/delete-image/:filename", authenticateJWT, async (req, res) => {
  const filename = req.params.filename;
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(`User ID: ${req.user._id}, Image Filename: ${filename}`); // Logging for verification
    const imageIndex = user.images.findIndex(image => image.name === filename);
    if (imageIndex > -1) {
      user.images.splice(imageIndex, 1);
      await user.save();
      res.json({ status: "ok", message: "Image deleted successfully." });
    } else {
      console.warn(`User not authorized to delete image: ${filename}`);
      res.status(403).json({ message: "Not authorized to delete this image" });
    }
  } catch (error) {
    console.error(`Error deleting image: ${error.message}`);
    res.status(500).json({ status: "error", error: error.message });
  }
});




app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
