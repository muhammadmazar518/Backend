const pool = require("../config/db");

const createCoursesTable = async () => {
  const createTable = `
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      instructor VARCHAR(100) NOT NULL,
      level VARCHAR(50) NOT NULL,
      duration VARCHAR(50),
      lessons INT DEFAULT 0,
      rating DECIMAL(2,1) DEFAULT 0,
      students INT DEFAULT 0,
      icon VARCHAR(10) DEFAULT '📚',
      color VARCHAR(20) DEFAULT '#38bdf8',
      description TEXT,
      tags TEXT[],
      locked BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const seedData = `
    INSERT INTO courses (title, instructor, level, duration, lessons, rating, students, icon, color, description, tags, locked)
    VALUES
      ('React Complete Guide', 'John Smith', 'Beginner', '12h 30m', 48, 4.8, 12400, '⚛️', '#38bdf8', 'Learn React from scratch — components, hooks, state management and more.', ARRAY['React','JavaScript','Hooks'], false),
      ('React Hooks Deep Dive', 'Sarah Johnson', 'Intermediate', '8h 15m', 32, 4.9, 8200, '🪝', '#a78bfa', 'Master all React hooks — useState, useEffect, useContext, useRef and custom hooks.', ARRAY['Hooks','useEffect','useState'], false),
      ('React Router & Navigation', 'Mike Davis', 'Intermediate', '5h 45m', 22, 4.7, 6100, '🔀', '#34d399', 'Build single page applications with React Router v6 — routes, params, guards.', ARRAY['React Router','Navigation','SPA'], false),
      ('State Management with Redux', 'Emily Chen', 'Advanced', '10h 20m', 40, 4.6, 5400, '🗄️', '#f59e0b', 'Learn Redux and Redux Toolkit for scalable state management in React apps.', ARRAY['Redux','Redux Toolkit','State'], false),
     ('React with TypeScript', 'Alex Turner', 'Advanced', '9h 10m', 36, 4.8, 4800, '🔷', '#fb7185', 'Build type-safe React applications with TypeScript — interfaces, generics and more.', ARRAY['TypeScript','React','Types'], false),
      ('React Performance Optimization', 'Chris Lee', 'Advanced', '6h 30m', 28, 4.9, 3200, '⚡', '#f472b6', 'Optimize your React apps with useMemo, useCallback, lazy loading and code splitting.', ARRAY['Performance','Memo','Lazy Loading'], false)
    ON CONFLICT DO NOTHING;
  `;

  try {
    await pool.query(createTable);
    await pool.query(seedData);
    console.log("Courses table ready");
  } catch (err) {
    console.error("Error creating courses table:", err.message);
  }
};

module.exports = { createCoursesTable };
