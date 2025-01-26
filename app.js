require("dotenv").config();

const express = require("express");
const path = require("path")
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const Blog = require("./models/blog")
const User = require("./models/user")

const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");

const { checkForAuthenticationCookie } = require("./middlewares/authentication");
const { localsName } = require("ejs");


const app = express();
const PORT = process.env.PORT || 9009;

mongoose
    .connect(process.env.MONGO_URL || "mongodb://localhost:27017/blogit")
    .then((e) => console.log("mongo connected"));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"))

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));
 
app.get("/", async (req, res) => {
    try {
        const allBlogs = await Blog.find({}).populate("createdBy");

        let creator = null;
        if (req.user) {
            creator = await User.findById(req.user._id);
        }

        res.render("home", {
            user: req.user,
            blogs: allBlogs,
            creator,
        });
    } catch (error) {
        console.error("Error fetching blogs:", error.message);
        res.status(500).send("Server Error");
    }
});
 

app.use("/user", userRoute);
app.use("/blog", blogRoute);

app.listen(PORT, () => {
    console.log(`started at PORT: ${PORT}`)
});
