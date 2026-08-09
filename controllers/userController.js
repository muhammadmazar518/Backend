const pool = require("../config/db");

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, is_pro, has_purchased, plan, created_at, avatar FROM users WHERE id = $1",
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateProfile = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      message: "Name and email are required",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1,
           email = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, is_pro, has_purchased, plan, created_at, avatar`,
      [name, email, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalUsersResult = await pool.query(
      "SELECT COUNT(*) FROM users"
    );

    const userResult = await pool.query(
      "SELECT is_pro, has_purchased FROM users WHERE id = $1",
      [req.user.id]
    );

    const user = userResult.rows[0];

    const isPro = Boolean(
      user?.is_pro || user?.has_purchased
    );

    // ALL courses in database
    const coursesResult = await pool.query(
      "SELECT COUNT(*) FROM courses"
    );

    const totalCourses = Number(
      coursesResult.rows[0].count
    );

    // Locked courses
    const lockedResult = await pool.query(
      "SELECT COUNT(*) FROM courses WHERE locked = true"
    );

    const lockedCourseCount = Number(
      lockedResult.rows[0].count
    );

    const lockedCourses = isPro
      ? 0
      : lockedCourseCount;

    const accessibleCourses = isPro
      ? totalCourses
      : Math.max(
          0,
          totalCourses - lockedCourseCount
        );

    return res.json({
      totalUsers: Number(
        totalUsersResult.rows[0].count
      ),
      activeSessions: 1,
      revenue: 0,
      pendingTasks: 0,

      totalCourses,
      lockedCourses,
      accessibleCourses,
    });
  } catch (err) {
    console.error(
      "Dashboard stats error:",
      err
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboardStats,
};