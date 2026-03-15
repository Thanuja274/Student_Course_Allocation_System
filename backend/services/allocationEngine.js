const db = require('../config/db');

/**
 * ALLOCATION ENGINE — Multi-pass greedy algorithm
 *
 * Pass 1: Fill rank-1 for all students (CGPA desc, submitted_at asc tiebreak)
 * Pass 2: Students who missed rank-1 try rank-2
 * ...
 * Final: Students who got nothing → waitlisted at rank-1 course
 */
async function runAllocation(semesterId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Lock semester row
    const [semRows] = await conn.query(
      'SELECT id, name FROM semesters WHERE id=? FOR UPDATE', [semesterId]
    );
    if (!semRows.length) throw new Error('Semester not found');

    // Clear previous results
    await conn.query('DELETE FROM allocations WHERE semester_id=?', [semesterId]);
    await conn.query(
      'UPDATE seat_tracker SET allocated_seats=0, waitlisted_seats=0 WHERE semester_id=?',
      [semesterId]
    );

    // Load courses with seat limits
    const [courses] = await conn.query(
      'SELECT id, code, name, max_seats FROM courses WHERE semester_id=?', [semesterId]
    );
    if (!courses.length) throw new Error('No courses found for this semester');

    // Seat counter map
    const seatCount = {};
    courses.forEach(c => { seatCount[c.id] = 0; });

    // All preferences sorted: rank ASC, cgpa DESC, submitted_at ASC
    const [allPrefs] = await conn.query(`
      SELECT p.student_id, p.course_id, p.priority_rank, p.submitted_at, u.cgpa
      FROM preferences p
      JOIN users u ON p.student_id=u.id
      WHERE p.semester_id=?
      ORDER BY p.priority_rank ASC, u.cgpa DESC, p.submitted_at ASC
    `, [semesterId]);

    if (!allPrefs.length) {
      await conn.commit();
      return { success: true, totalAllocated: 0, totalWaitlisted: 0, totalStudents: 0, message: 'No preferences submitted' };
    }

    const allocatedStudents = new Set();
    const allocationRows    = [];
    const maxRank = Math.max(...allPrefs.map(p => p.priority_rank));

    // Multi-pass allocation
    for (let rank = 1; rank <= maxRank; rank++) {
      const rankPrefs = allPrefs.filter(
        p => p.priority_rank === rank && !allocatedStudents.has(p.student_id)
      );
      for (const pref of rankPrefs) {
        const course = courses.find(c => c.id === pref.course_id);
        if (!course) continue;
        if (seatCount[pref.course_id] < course.max_seats) {
          seatCount[pref.course_id]++;
          allocatedStudents.add(pref.student_id);
          allocationRows.push([pref.student_id, pref.course_id, semesterId, 'allocated', rank]);
        }
      }
    }

    // Waitlist pass
    const allStudentIds  = [...new Set(allPrefs.map(p => p.student_id))];
    const unallocatedIds = allStudentIds.filter(id => !allocatedStudents.has(id));
    const waitlistCount  = {};

    for (const studentId of unallocatedIds) {
      const topPref = allPrefs.find(p => p.student_id === studentId && p.priority_rank === 1);
      if (topPref) {
        waitlistCount[topPref.course_id] = (waitlistCount[topPref.course_id] || 0) + 1;
        allocationRows.push([studentId, topPref.course_id, semesterId, 'waitlisted', 1]);
      }
    }

    // Bulk insert allocations
    if (allocationRows.length > 0) {
      await conn.query(
        'INSERT INTO allocations (student_id,course_id,semester_id,status,preference_rank) VALUES ?',
        [allocationRows]
      );
    }

    // Update seat tracker
    for (const course of courses) {
      const filled    = seatCount[course.id] || 0;
      const waitlisted = waitlistCount[course.id] || 0;
      await conn.query(
        'UPDATE seat_tracker SET allocated_seats=?, waitlisted_seats=? WHERE course_id=?',
        [filled, waitlisted, course.id]
      );
    }

    // Mark semester done
    await conn.query('UPDATE semesters SET allocation_done=1 WHERE id=?', [semesterId]);

    await conn.commit();

    const totalAllocated  = allocationRows.filter(r => r[3] === 'allocated').length;
    const totalWaitlisted = allocationRows.filter(r => r[3] === 'waitlisted').length;

    return {
      success: true,
      semesterName:   semRows[0].name,
      totalStudents:  allStudentIds.length,
      totalAllocated,
      totalWaitlisted,
      allocationRate: allStudentIds.length
        ? ((totalAllocated / allStudentIds.length) * 100).toFixed(1) + '%'
        : '0%',
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Promote first waitlisted student when a seat opens
async function promoteWaitlist(courseId, semesterId) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [waitlisted] = await conn.query(`
      SELECT a.student_id FROM allocations a
      JOIN preferences p ON p.student_id=a.student_id AND p.course_id=a.course_id AND p.semester_id=a.semester_id
      WHERE a.course_id=? AND a.semester_id=? AND a.status='waitlisted'
      ORDER BY p.submitted_at ASC LIMIT 1
    `, [courseId, semesterId]);

    if (!waitlisted.length) { await conn.commit(); return { promoted: false }; }

    const studentId = waitlisted[0].student_id;
    await conn.query(
      "UPDATE allocations SET status='allocated', allocated_at=NOW() WHERE student_id=? AND course_id=? AND semester_id=?",
      [studentId, courseId, semesterId]
    );
    await conn.query(
      'UPDATE seat_tracker SET allocated_seats=allocated_seats+1, waitlisted_seats=GREATEST(waitlisted_seats-1,0) WHERE course_id=?',
      [courseId]
    );
    await conn.commit();
    return { promoted: true, studentId };
  } catch (err) { await conn.rollback(); throw err; }
  finally { conn.release(); }
}

module.exports = { runAllocation, promoteWaitlist };
