const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const DATA_FILE = path.join(__dirname, "data", "properties.json");

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Admin token
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "michael2025";

// GET all properties
app.get("/api/properties", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(data);
});

// CREATE property
app.post("/api/properties", upload.single("image"), (req, res) => {
  if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  const id = Date.now().toString();

  const newProp = {
    id,
    title: req.body.title || "",
    type: req.body.type || "sale",
    price: req.body.price ? Number(req.body.price) : 0,
    beds: req.body.beds ? Number(req.body.beds) : 0,
    baths: req.body.baths ? Number(req.body.baths) : 0,
    suburb: req.body.suburb || "",
    city: req.body.city || "",
    description: req.body.description || "",
    externalLink: req.body.externalLink || "",
    imageUrl: req.file ? "/uploads/" + req.file.filename : "",
    createdAt: new Date().toISOString()
  };

  data.push(newProp);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.json(newProp);
});

// UPDATE property
app.put("/api/properties/:id", upload.single("image"), (req, res) => {
  if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.params.id;
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  const index = data.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Not found" });

  const existing = data[index];

  const updated = {
    ...existing,
    title: req.body.title || existing.title,
    type: req.body.type || existing.type,
    price: req.body.price ? Number(req.body.price) : existing.price,
    beds: req.body.beds ? Number(req.body.beds) : existing.beds,
    baths: req.body.baths ? Number(req.body.baths) : existing.baths,
    suburb: req.body.suburb || existing.suburb,
    city: req.body.city || existing.city,
    description: req.body.description || existing.description,
    externalLink: req.body.externalLink || existing.externalLink,
    imageUrl: req.file ? "/uploads/" + req.file.filename : existing.imageUrl
  };

  data[index] = updated;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.json(updated);
});

// DELETE property
app.delete("/api/properties/:id", (req, res) => {
  if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.params.id;
  let data = JSON.parse(fs.readFileSync(DATA_FILE));
  data = data.filter((p) => p.id !== id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  res.json({ success: true });
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
