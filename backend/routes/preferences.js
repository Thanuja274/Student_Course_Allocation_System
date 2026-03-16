const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticate } = require('../middleware/auth');

// POST /api/preferences — submit or update preferences
router.post('/', authenticate, async (req, res) => {
  const studentId  = req.user.id;
  const { preferences } = req.body;

  if (!Array.isArray(preferences) || preferences.length === 0)
    return res.status(400).json({ error: 'preferences array is required' });
  if (preferences.length > 8)
    return res.status(400).json({ error: 'Maximum 8 preferences allowed' });

  const courseIds = preferences.map(p => p.course_id);
  if (new Set(courseIds).size !== courseIds.length)
    return res.status(400).json({ error: 'Duplicate courses in preferences' });

  try {
    // Check active semester
    const [sems] = await db.query(
      'SELECT id, preference_deadline, allocation_done FROM semesters WHERE is_active=1 LIMIT 1'
    );
    if (!sems.length) return res.status(400).json({ error: 'No active semester' });
    const sem = sems[0];
    if (new Date() > new Date(sem.preference_deadline))
      return res.status(400).json({ error: 'Preference submission deadline has passed' });
    const semId = sem.id;
    
    // Check if student already has allocations for this semester
    const [existingAllocations] = await db.query(
      'SELECT COUNT(*) AS cnt FROM allocations WHERE student_id=? AND semester_id=?', [studentId, semId]
    );
    if (existingAllocations[0].cnt > 0)
      return res.status(400).json({ error: 'You already have course allocations. Preferences cannot be modified after allocation.' });

    // Get student info
    const [students] = await db.query(
      'SELECT current_year, department_id FROM users WHERE id=?', [studentId]
    );
    if (!students.length) return res.status(404).json({ error: 'Student not found' });
    const student = students[0];

    // Validate each course
    for (const pref of preferences) {
      if (!Number.isInteger(pref.priority_rank) || pref.priority_rank < 1)
        return res.status(400).json({ error: 'Invalid priority_rank' });

      const [courseRows] = await db.query(
        'SELECT id, min_year FROM courses WHERE id=? AND semester_id=?', [pref.course_id, semId]
      );
      if (!courseRows.length)
        return res.status(400).json({ error: `Course ${pref.course_id} not offered this semester` });
      if (student.current_year < courseRows[0].min_year)
        return res.status(400).json({ error: `Year requirement not met for course ${pref.course_id}` });

      // Prerequisite check
      const [prereqs] = await db.query(
        'SELECT required_course_id FROM prerequisites WHERE course_id=?', [pref.course_id]
      );
      for (const prereq of prereqs) {
        const [done] = await db.query(
          'SELECT id FROM completed_courses WHERE student_id=? AND course_id=?',
          [studentId, prereq.required_course_id]
        );
        if (!done.length)
          return res.status(400).json({ error: `Prerequisite not completed for course ${pref.course_id}` });
      }
    }

    // Timetable conflict check
    for (let i = 0; i < preferences.length; i++) {
      for (let j = i + 1; j < preferences.length; j++) {
        const [conflicts] = await db.query(`
          SELECT COUNT(*) AS cnt
          FROM timetable_slots t1
          JOIN timetable_slots t2 ON t1.day_of_week=t2.day_of_week
          WHERE t1.course_id=? AND t2.course_id=?
            AND t1.start_time < t2.end_time AND t1.end_time > t2.start_time
        `, [preferences[i].course_id, preferences[j].course_id]);
        if (conflicts[0].cnt > 0)
          return res.status(400).json({
            error: `Timetable conflict between course ${preferences[i].course_id} and ${preferences[j].course_id}`
          });
      }
    }

    // Atomic replace
    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
      await conn.query('DELETE FROM preferences WHERE student_id=? AND semester_id=?', [studentId, semId]);
      for (const pref of preferences)
        await conn.query(
          'INSERT INTO preferences (student_id,course_id,semester_id,priority_rank) VALUES (?,?,?,?)',
          [studentId, pref.course_id, semId, pref.priority_rank]
        );
      await conn.commit();
      conn.release();
      res.json({ message: 'Preferences saved successfully', count: preferences.length });
    } catch (err) {
      await conn.rollback(); conn.release(); throw err;
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/preferences/mine
router.get('/mine', authenticate, async (req, res) => {
  try {
    const [sems] = await db.query('SELECT id FROM semesters WHERE is_active=1 LIMIT 1');
    if (!sems.length) return res.json([]);
    const [prefs] = await db.query(`
      SELECT p.priority_rank, p.submitted_at,
             c.id AS course_id, c.code, c.name, c.credits, c.instructor,
             c.max_seats, COALESCE(st.allocated_seats,0) AS filled_seats,
             (c.max_seats - COALESCE(st.allocated_seats,0)) AS available_seats,
             GROUP_CONCAT(
               CONCAT(ts.day_of_week,' ',TIME_FORMAT(ts.start_time,'%H:%i'),'-',TIME_FORMAT(ts.end_time,'%H:%i'))
               SEPARATOR ' | '
             ) AS schedule
      FROM preferences p
      JOIN courses c ON p.course_id=c.id
      LEFT JOIN seat_tracker st ON st.course_id=c.id
      LEFT JOIN timetable_slots ts ON ts.course_id=c.id
      WHERE p.student_id=? AND p.semester_id=?
      GROUP BY p.id ORDER BY p.priority_rank
    `, [req.user.id, sems[0].id]);
    res.json(prefs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/preferences
router.delete('/', authenticate, async (req, res) => {
  try {
    const [sems] = await db.query(
      'SELECT id, preference_deadline, allocation_done FROM semesters WHERE is_active=1 LIMIT 1'
    );
    // Check if student already has allocations for this semester
    const [existingAllocations] = await db.query(
      'SELECT COUNT(*) AS cnt FROM allocations WHERE student_id=? AND semester_id=?', [req.user.id, sems[0].id]
    );
    if (existingAllocations[0].cnt > 0)
      return res.status(400).json({ error: 'You already have course allocations. Preferences cannot be modified after allocation.' });
    if (new Date() > new Date(sems[0].preference_deadline))
      return res.status(400).json({ error: 'Deadline passed' });
    await db.query('DELETE FROM preferences WHERE student_id=? AND semester_id=?', [req.user.id, sems[0].id]);
    res.json({ message: 'Preferences cleared' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
