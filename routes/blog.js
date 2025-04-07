const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");
const User = require("../models/user");

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve("./public/uploads/"));
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname}`;
        cb(null, fileName);
    },
});

const upload = multer({ storage: storage });

router.get("/add-new", async (req, res) => {
    try {
        let creator = null;
        if (req.user) {
            creator = await User.findById(req.user._id);
        }

        res.render("addBlog", {
            user: req.user,
            creator,
        });
    } catch (error) {
        console.error("Error fetching blogs:", error.message);
        res.status(500).send("Server Error");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate("createdBy");
        const creator = req.user ? await User.findById(req.user._id) : null;
        const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy");
        return res.render('blog', {
            user: req.user,
            blog,
            comments,
            creator,
        });
    } catch (error) {
        console.error("Error fetching blog:", error.message);
        res.status(500).send("Server Error");
    }
});

router.post("/comment/:blogId", async (req, res) => {
    if (!req.user) {
        return res.status(401).send("Unauthorized");
    }

    try {
        const comment = await Comment.create({
            content: req.body.content,
            blogId: req.params.blogId,
            createdBy: req.user._id,
        });
        return res.redirect(`/blog/${req.params.blogId}`);
    } catch (error) {
        console.error("Error creating comment:", error.message);
        res.status(500).send("Server Error");
    }
});

router.post("/", upload.single('coverImage'), async (req, res) => {
    try {
        const { title, body } = req.body;
    
        const blog = await Blog.create({
            body,
            title,
            createdBy: req.user._id,
            coverImageURL: `/uploads/${req.file.filename}`,
        });
        return res.redirect(`/blog/${blog._id}`);
    } catch (error) {
        console.error("Error creating blog:", error.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;