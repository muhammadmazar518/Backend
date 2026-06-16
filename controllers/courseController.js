// const pool = require("../config/db");

// const getAllCourses = async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM courses ORDER BY id ASC"
//     );
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// const getCourseById = async (req, res) => {
//   try {
//     const result = await pool.query(
//       "SELECT * FROM courses WHERE id = $1",
//       [req.params.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Course not found" });
//     }

//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// const createCourse = async (req, res) => {
//   const {
//     title,
//     instructor,
//     level,
//     duration,
//     lessons,
//     rating,
//     students,
//     icon,
//     color,
//     description,
//     tags,
//     locked,
//   } = req.body;

//   if (!title || !instructor || !level) {
//     return res
//       .status(400)
//       .json({ message: "Title, instructor and level are required" });
//   }

//   try {
//     const result = await pool.query(
//       `INSERT INTO courses (title, instructor, level, duration, lessons, rating, students, icon, color, description, tags, locked)
//        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
//        RETURNING *`,
//       [
//         title,
//         instructor,
//         level,
//         duration,
//         lessons,
//         rating,
//         students,
//         icon,
//         color,
//         description,
//         tags,
//         locked || false,
//       ]
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// const updateCourse = async (req, res) => {
//   const {
//     title,
//     instructor,
//     level,
//     duration,
//     lessons,
//     rating,
//     students,
//     icon,
//     color,
//     description,
//     tags,
//     locked,
//   } = req.body;

//   try {
//     const result = await pool.query(
//       `UPDATE courses
//        SET title=$1, instructor=$2, level=$3, duration=$4, lessons=$5,
//            rating=$6, students=$7, icon=$8, color=$9, description=$10,
//            tags=$11, locked=$12
//        WHERE id=$13
//        RETURNING *`,
//       [
//         title,
//         instructor,
//         level,
//         duration,
//         lessons,
//         rating,
//         students,
//         icon,
//         color,
//         description,
//         tags,
//         locked,
//         req.params.id,
//       ]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Course not found" });
//     }

//     res.json(result.rows[0]);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// const deleteCourse = async (req, res) => {
//   try {
//     const result = await pool.query(
//       "DELETE FROM courses WHERE id = $1 RETURNING id",
//       [req.params.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ message: "Course not found" });
//     }

//     res.json({ message: "Course deleted" });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// module.exports = {
//   getAllCourses,
//   getCourseById,
//   createCourse,
//   updateCourse,
//   deleteCourse,
// };

const pool = require("../config/db");

// GET /api/courses — courses locked based on user's pro status
const getAllCourses = async (req, res) => {
  try {
    // Get user's pro status
    const userResult = await pool.query(
      "SELECT is_pro, has_purchased FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = userResult.rows[0];
    const isPro = user?.is_pro || user?.has_purchased || false;

    const result = await pool.query("SELECT * FROM courses ORDER BY id ASC");

    // If user is pro — unlock all courses
    const courses = result.rows.map((course) => ({
      ...course,
      locked: isPro ? false : course.locked,
    }));

    res.json(courses);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/courses/:id
const getCourseById = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courses WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Course not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/courses
const createCourse = async (req, res) => {
  const { title, instructor, level, duration, lessons, rating, students, icon, color, description, tags, locked } = req.body;
  if (!title || !instructor || !level)
    return res.status(400).json({ message: "Title, instructor and level are required" });
  try {
    const result = await pool.query(
      `INSERT INTO courses (title, instructor, level, duration, lessons, rating, students, icon, color, description, tags, locked)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [title, instructor, level, duration, lessons, rating, students, icon, color, description, tags, locked || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/courses/:id
const updateCourse = async (req, res) => {
  const { title, instructor, level, duration, lessons, rating, students, icon, color, description, tags, locked } = req.body;
  try {
    const result = await pool.query(
      `UPDATE courses SET title=$1, instructor=$2, level=$3, duration=$4, lessons=$5,
       rating=$6, students=$7, icon=$8, color=$9, description=$10, tags=$11, locked=$12
       WHERE id=$13 RETURNING *`,
      [title, instructor, level, duration, lessons, rating, students, icon, color, description, tags, locked, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Course not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM courses WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse };
