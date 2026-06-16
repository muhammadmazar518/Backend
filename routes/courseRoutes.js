const express = require("express");
const router = express.Router();
const { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse } = require("../controllers/courseController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAllCourses);
router.get("/:id", protect, getCourseById);
router.post("/", protect, createCourse);
router.put("/:id", protect, updateCourse);
router.delete("/:id", protect, deleteCourse);

module.exports = router;