const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [[totalStudents]] = await db.query(
      "SELECT COUNT(*) AS cnt FROM users WHERE role='student' AND is_active=1"
    );
    const [[totalCourses]] = await db.query(
      "SELECT COUNT(*) AS cnt FROM courses c JOIN semesters s ON c.semester_id=s.id WHERE s.is_active=1"
    );
    const [[totalPrefs]] = await db.query(
      "SELECT COUNT(DISTINCT student_id) AS cnt FROM preferences p JOIN semesters s ON p.semester_id=s.id WHERE s.is_active=1"
    );
    const [[allocated]] = await db.query(
      "SELECT COUNT(*) AS cnt FROM allocations a JOIN semesters s ON a.semester_id=s.id WHERE s.is_active=1 AND a.status='allocated'"
    );
    const [[waitlisted]] = await db.query(
      "SELECT COUNT(*) AS cnt FROM allocations a JOIN semesters s ON a.semester_id=s.id WHERE s.is_active=1 AND a.status='waitlisted'"
    );
    const [sem] = await db.query(
      'SELECT id,name,preference_deadline,is_active,allocation_done FROM semesters WHERE is_active=1 LIMIT 1'
    );
    const [topCourses] = await db.query(`
      SELECT c.name, c.code, c.max_seats,
             COUNT(p.id) AS preference_count,
             COALESCE(st.allocated_seats,0) AS allocated_seats
      FROM courses c
      JOIN semesters s ON c.semester_id=s.id AND s.is_active=1
      LEFT JOIN preferences p   ON p.course_id=c.id
      LEFT JOIN seat_tracker st ON st.course_id=c.id
      GROUP BY c.id ORDER BY preference_count DESC LIMIT 5
    `);
    res.json({
      currentSemester:         sem[0] || null,
      totalStudents:           totalStudents.cnt,
      totalCourses:            totalCourses.cnt,
      studentsWithPreferences: totalPrefs.cnt,
      allocated:               allocated.cnt,
      waitlisted:              waitlisted.cnt,
      topCourses,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/enrollment-report
router.get('/enrollment-report', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.id, c.code, c.name, c.credits, c.instructor, c.max_seats,
             d.name AS department,
             COALESCE(st.allocated_seats,0)  AS enrolled,
             COALESCE(st.waitlisted_seats,0) AS waitlisted,
             COUNT(p.id) AS total_preferences,
             ROUND(COALESCE(st.allocated_seats,0)/c.max_seats*100,1) AS utilization_pct
      FROM courses c
      JOIN semesters s ON c.semester_id=s.id AND s.is_active=1
      LEFT JOIN departments d   ON c.department_id=d.id
      LEFT JOIN seat_tracker st ON st.course_id=c.id
      LEFT JOIN preferences p   ON p.course_id=c.id
      GROUP BY c.id ORDER BY utilization_pct DESC, total_preferences DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/unallocated
router.get('/unallocated', async (req, res) => {
  try {
    const [sems] = await db.query('SELECT id FROM semesters WHERE is_active=1 LIMIT 1');
    if (!sems.length) return res.json([]);
    const semId = sems[0].id;
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.roll_number, u.email, u.cgpa, u.current_year,
             d.name AS department, COUNT(p.id) AS preference_count
      FROM users u
      LEFT JOIN departments d ON d.id=u.department_id
      LEFT JOIN preferences p ON p.student_id=u.id AND p.semester_id=?
      WHERE u.role='student'
        AND u.id IN (SELECT student_id FROM preferences WHERE semester_id=?)
        AND u.id NOT IN (SELECT student_id FROM allocations WHERE semester_id=? AND status='allocated')
      GROUP BY u.id ORDER BY u.roll_number
    `, [semId, semId, semId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/students
router.get('/students', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, u.roll_number, u.current_year, u.cgpa, u.is_active,
             d.name AS department
      FROM users u LEFT JOIN departments d ON d.id=u.department_id
      WHERE u.role='student' ORDER BY u.roll_number
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── REPORTING ROUTES ──────────────────────────────────────────

// GET /api/admin/report/enrollment
router.get('/report/enrollment', async (req, res) => {
  try {
    const [sem] = await db.query('SELECT * FROM semesters WHERE is_active=1 LIMIT 1');
    const [rows] = await db.query(`
      SELECT c.code, c.name, c.credits, c.instructor, c.max_seats,
             d.name AS department,
             COALESCE(st.allocated_seats,0)  AS enrolled,
             COALESCE(st.waitlisted_seats,0) AS waitlisted,
             c.max_seats - COALESCE(st.allocated_seats,0) AS available,
             COUNT(p.id) AS total_preferences,
             ROUND(COALESCE(st.allocated_seats,0)/c.max_seats*100,1) AS utilization_pct
      FROM courses c
      JOIN semesters s ON c.semester_id=s.id AND s.is_active=1
      LEFT JOIN departments d   ON c.department_id=d.id
      LEFT JOIN seat_tracker st ON st.course_id=c.id
      LEFT JOIN preferences p   ON p.course_id=c.id
      GROUP BY c.id ORDER BY d.name, c.code
    `);
    res.json({ semester: sem[0] || null, data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/report/seat-utilization
router.get('/report/seat-utilization', async (req, res) => {
  try {
    const [sem] = await db.query('SELECT * FROM semesters WHERE is_active=1 LIMIT 1');
    const [rows] = await db.query(`
      SELECT c.code, c.name, c.max_seats,
             d.name AS department,
             COALESCE(st.allocated_seats,0)  AS allocated,
             COALESCE(st.waitlisted_seats,0) AS waitlisted,
             c.max_seats - COALESCE(st.allocated_seats,0) AS remaining,
             ROUND(COALESCE(st.allocated_seats,0)/c.max_seats*100,1) AS utilization_pct,
             CASE
               WHEN COALESCE(st.allocated_seats,0)/c.max_seats >= 0.9 THEN 'High'
               WHEN COALESCE(st.allocated_seats,0)/c.max_seats >= 0.5 THEN 'Medium'
               ELSE 'Low'
             END AS demand_level
      FROM courses c
      JOIN semesters s ON c.semester_id=s.id AND s.is_active=1
      LEFT JOIN departments d   ON c.department_id=d.id
      LEFT JOIN seat_tracker st ON st.course_id=c.id
      ORDER BY utilization_pct DESC
    `);
    const [[summary]] = await db.query(`
      SELECT SUM(c.max_seats) AS total_seats,
             SUM(COALESCE(st.allocated_seats,0)) AS total_allocated,
             ROUND(SUM(COALESCE(st.allocated_seats,0))/SUM(c.max_seats)*100,1) AS overall_utilization
      FROM courses c
      JOIN semesters s ON c.semester_id=s.id AND s.is_active=1
      LEFT JOIN seat_tracker st ON st.course_id=c.id
    `);
    res.json({ semester: sem[0] || null, summary, data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/report/unallocated-students
router.get('/report/unallocated-students', async (req, res) => {
  try {
    const [sems] = await db.query('SELECT * FROM semesters WHERE is_active=1 LIMIT 1');
    if (!sems.length) return res.json({ semester: null, data: [] });
    const semId = sems[0].id;
    const [rows] = await db.query(`
      SELECT u.roll_number, u.name, u.email, u.cgpa, u.current_year,
             d.name AS department,
             COUNT(p.id) AS preferences_submitted,
             GROUP_CONCAT(c.code ORDER BY p.priority_rank SEPARATOR ', ') AS preferred_courses
      FROM users u
      LEFT JOIN departments d   ON d.id=u.department_id
      LEFT JOIN preferences p   ON p.student_id=u.id AND p.semester_id=?
      LEFT JOIN courses c        ON c.id=p.course_id
      WHERE u.role='student'
        AND u.id IN (SELECT student_id FROM preferences WHERE semester_id=?)
        AND u.id NOT IN (SELECT student_id FROM allocations WHERE semester_id=? AND status='allocated')
      GROUP BY u.id ORDER BY d.name, u.roll_number
    `, [semId, semId, semId]);
    const [[totalStudents]] = await db.query(
      "SELECT COUNT(*) AS cnt FROM users WHERE role='student' AND is_active=1"
    );
    res.json({ semester: sems[0], totalStudents: totalStudents.cnt, data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/report/course-popularity
router.get('/report/course-popularity', async (req, res) => {
  try {
    const [sem] = await db.query('SELECT * FROM semesters WHERE is_active=1 LIMIT 1');
    const [rows] = await db.query(`
      SELECT c.code, c.name, c.max_seats, d.name AS department,
             COUNT(p.id) AS total_preferences,
             SUM(CASE WHEN p.priority_rank=1 THEN 1 ELSE 0 END) AS first_choice_count,
             SUM(CASE WHEN p.priority_rank<=3 THEN 1 ELSE 0 END) AS top3_count,
             ROUND(COUNT(p.id)/c.max_seats,2) AS demand_ratio,
             COALESCE(st.allocated_seats,0) AS allocated,
             ROUND(COUNT(p.id)/(SELECT COUNT(*) FROM users WHERE role='student' AND is_active=1)*100,1) AS preference_pct
      FROM courses c
      JOIN semesters s ON c.semester_id=s.id AND s.is_active=1
      LEFT JOIN departments d   ON c.department_id=d.id
      LEFT JOIN preferences p   ON p.course_id=c.id
      LEFT JOIN seat_tracker st ON st.course_id=c.id
      GROUP BY c.id ORDER BY total_preferences DESC
    `);
    res.json({ semester: sem[0] || null, data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/semester/deadline
router.put('/semester/deadline', async (req, res) => {
  const { deadline } = req.body;
  if (!deadline) return res.status(400).json({ error: 'deadline required' });
  try {
    await db.query('UPDATE semesters SET preference_deadline=? WHERE is_active=1', [deadline]);
    res.json({ message: 'Deadline updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/semester/reset
router.post('/semester/reset', async (req, res) => {
  try {
    const [sems] = await db.query('SELECT id FROM semesters WHERE is_active=1 LIMIT 1');
    if (!sems.length) return res.status(400).json({ error: 'No active semester' });
    const semId = sems[0].id;
    await db.query('DELETE FROM allocations WHERE semester_id=?', [semId]);
    await db.query('UPDATE seat_tracker SET allocated_seats=0, waitlisted_seats=0 WHERE semester_id=?', [semId]);
    await db.query('UPDATE semesters SET allocation_done=0 WHERE id=?', [semId]);
    res.json({ message: 'Allocation reset.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;