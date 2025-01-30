const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sequelize = require("./database/db");
const user = require("./model/user");
require("dotenv").config();

// MIDLLEWARE
app.use(cors());
app.use(express.json());

sequelize
  .authenticate()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("Database connection failed:", err));

sequelize
  .sync()
  .then(() => console.log("Database & tables created!"))
  .catch((err) => console.error("Database sync failed:", err));

// ROUTES
app.post("/register", async (req, res) => {
  try {
    const { nama, email, password } = req.body;
    console.log(req.body);
    const hashedPassword = await bcrypt
      .hash(password, 12)
      .then((result) => result);
    const User = await user.create({
      username: nama,
      email: email,
      password: hashedPassword,
    });
    console.log(User);
    if (User) {
      res.json({ msg: "Register Successfully" });
    }
  } catch (error) {
    console.log("error ::", error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const User = await user.findOne({ where: { email } });

    const isMatch = await bcrypt.compare(password, User.password);
    if (User && isMatch) {
      const token = jwt.sign(
        { email: email, password:password },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES }
      );
      res.json({ msg: "Login Berhasil", token: token});
    } else {
      res
        .status(404)
        .json({ msg: "User Tidak Ditemukan", invalid: "Password Salah" });
    }

  } catch (error) {
    console.log("error in login ::", error);
  }
});

// PROTECTED ROUTE
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization").split(" ")[1];
  console.log(token)
  if (!token) return res.status(403).json({ error: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
};

app.get("/", verifyToken, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

