const express = require("express");
const port = 8000;
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");

// connedting mongoDB;
mongoose
  .connect("mongodb://127.0.0.1:27017/YashDemo")
  .then(() => {
    console.log(`MongoDB connected !`);
  })
  .catch((error) => {
    console.log(`error ${error}`);
  });
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("./assets"));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "heyheyiamRoy");
    console.log(decoded);
    req.user = await User.findById(decoded._id);
    console.log(req.user);
    next();
  } else {
    console.log("cookie is absent");
    return res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  return res.render("logout", {
    name: req.user.name,
  });
});
app.get("/login", (req, res) => {
  return res.render("login");
});
app.get("/register", (req, res) => {
  return res.render("register");
});

// POST methods ;

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.render("register", {
      name,
      password,
      message: "Opps ! looks like user is already registered !",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });
  return res.redirect("/login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.render("login", {
      message: "User not exists kindly register first !",
    });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.render("login", {
      email,
      message: "Opps ! Wrong password !",
    });

  const token = jwt.sign({ _id: user._id }, "heyheyiamRoy");
  console.log(token);
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  return res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  return res.redirect("/");
});
app.listen(port, () => {
  console.log(`Sucessfully connected to server !`);
});
