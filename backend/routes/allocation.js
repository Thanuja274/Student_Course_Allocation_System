const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { runAllocation, promoteWaitlist } = require('../services/allocationEngine');

// POST /api/allocation/run
router.post('/run', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [sems] = await db.query('SELECT id FROM semesters WHERE is_active=1 LIMIT 1');
    if (!sems.length) return res.status(400).json({ error: 'No active semester found' });
    const result = await runAllocation(sems[0].id);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/allocation/my-result
router.get('/my-result', authenticate, async (req, res) => {
  try {
    const [sems] = await db.query('SELECT id, allocation_done FROM semesters WHERE is_active=1 LIMIT 1');
    if (!sems.length) return res.json({ published: false, results: [] });
    if (!sems[0].allocation_done) return res.json({ published: false, results: [] });
    const [results] = await db.query(`
      SELECT a.status, a.preference_rank, a.allocated_at, a.allocated_by,
             c.id AS course_id, c.code, c.name, c.credits, c.instructor,
             GROUP_CONCAT(
               CONCAT(ts.day_of_week,' ',TIME_FORMAT(ts.start_time,'%H:%i'),'-',
               TIME_FORMAT(ts.end_time,'%H:%i'),' (',ts.room,')')
               ORDER BY ts.day_of_week SEPARATOR ' | '
             ) AS schedule
      FROM allocations a
      JOIN courses c ON a.course_id=c.id
      LEFT JOIN timetable_slots ts ON ts.course_id=c.id
      WHERE a.student_id=? AND a.semester_id=?
      GROUP BY a.id ORDER BY a.status, c.code
    `, [req.user.id, sems[0].id]);
    res.json({ published: true, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/allocation/all — ✅ includes course_id for frontend remove button
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [sems] = await db.query('SELECT id FROM semesters WHERE is_active=1 LIMIT 1');
    if (!sems.length) return res.json([]);
    const [rows] = await db.query(`
      SELECT a.status, a.preference_rank, a.allocated_at, a.allocated_by, a.admin_note,
             u.id   AS student_id,   u.name AS student_name, u.roll_number, u.cgpa,
             d.name AS department,
             c.id   AS course_id,
             c.code AS course_code,  c.name AS course_name,  c.credits
      FROM allocations a
      JOIN users u ON a.student_id=u.id
      LEFT JOIN departments d ON d.id=u.department_id
      JOIN courses c ON a.course_id=c.id
      WHERE a.semester_id=?
      ORDER BY u.roll_number, a.status
    `, [sems[0].id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/allocation/override
router.post('/override', authenticate, authorize('admin'), async (req, res) => {
  const { student_id, course_id, note } = req.body;
  if (!student_id || !course_id) return res.status(400).json({ error: 'student_id and course_id required' });
  try {
    const [sems] = await db.query('SELECT id FROM semesters WHERE is_active=1 LIMIT 1');
    if (!sems.length) return res.status(400).json({ error: 'No active semester' });
    const semId = sems[0].id;
    await db.query(`
      INSERT INTO allocations (student_id,course_id,semester_id,status,allocated_by,admin_note)
      VALUES (?,?,?,'allocated','admin',?)
      ON DUPLICATE KEY UPDATE status='allocated', allocated_by='admin', admin_note=?, allocated_at=NOW()
    `, [student_id, course_id, semId, note||null, note||null]);
    await db.query('UPDATE seat_tracker SET allocated_seats=allocated_seats+1 WHERE course_id=?', [course_id]);
    res.json({ message: 'Manual override successful' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/allocation/:studentId/:courseId
router.delete('/:studentId/:courseId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [sems] = await db.query('SELECT id FROM semesters WHERE is_active=1 LIMIT 1');
    if (!sems.length) return res.status(400).json({ error: 'No active semester' });
    const semId = sems[0].id;
    const [result] = await db.query(
      'DELETE FROM allocations WHERE student_id=? AND course_id=? AND semester_id=?',
      [req.params.studentId, req.params.courseId, semId]
    );
    if (result.affectedRows > 0) {
      await db.query('UPDATE seat_tracker SET allocated_seats=GREATEST(allocated_seats-1,0) WHERE course_id=?', [req.params.courseId]);
      await promoteWaitlist(req.params.courseId, semId);
    }
    res.json({ message: 'Allocation removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
