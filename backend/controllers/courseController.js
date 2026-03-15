const db = require('../config/db');

const getAll = async (req, res) => {
  try {
    const [courses] = await db.query(`
      SELECT c.id, c.code, c.name, c.description, c.credits,
             c.instructor, c.max_seats, c.min_year, c.is_elective,
             d.name AS department_name,
             COALESCE(st.allocated_seats,0)  AS allocated_seats,
             COALESCE(st.waitlisted_seats,0) AS waitlisted_seats,
             (c.max_seats - COALESCE(st.allocated_seats,0)) AS available_seats,
             GROUP_CONCAT(
               DISTINCT CONCAT(ts.day_of_week,' ',
               TIME_FORMAT(ts.start_time,'%H:%i'),'-',
               TIME_FORMAT(ts.end_time,'%H:%i'),' (',ts.room,')')
               ORDER BY ts.day_of_week SEPARATOR ' | '
             ) AS schedule
      FROM courses c
      JOIN semesters s ON c.semester_id=s.id AND s.is_active=1
      LEFT JOIN departments d    ON c.department_id=d.id
      LEFT JOIN seat_tracker st  ON st.course_id=c.id
      LEFT JOIN timetable_slots ts ON ts.course_id=c.id
      GROUP BY c.id ORDER BY c.code
    `);
    res.json(courses);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getOne = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, d.name AS department_name,
             COALESCE(st.allocated_seats,0) AS allocated_seats,
             (c.max_seats - COALESCE(st.allocated_seats,0)) AS available_seats
      FROM courses c
      LEFT JOIN departments d   ON c.department_id=d.id
      LEFT JOIN seat_tracker st ON st.course_id=c.id
      WHERE c.id=?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Course not found' });
    const [slots]  = await db.query('SELECT * FROM timetable_slots WHERE course_id=?', [req.params.id]);
    const [prereqs]= await db.query(
      `SELECT c.id,c.code,c.name FROM prerequisites p
       JOIN courses c ON p.required_course_id=c.id WHERE p.course_id=?`, [req.params.id]
    );
    res.json({ ...rows[0], slots, prerequisites: prereqs });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const create = async (req, res) => {
  const { code,name,description,credits,department_id,instructor,max_seats,
          min_year,semester_id,is_elective,slots=[],prerequisites=[] } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO courses (code,name,description,credits,department_id,instructor,
       max_seats,min_year,semester_id,is_elective) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [code,name,description,credits,department_id,instructor,max_seats,min_year||1,semester_id,is_elective!==false]
    );
    const courseId = r.insertId;
    await conn.query('INSERT INTO seat_tracker (course_id,semester_id) VALUES (?,?)', [courseId,semester_id]);
    for (const s of slots)
      await conn.query('INSERT INTO timetable_slots (course_id,day_of_week,start_time,end_time,room) VALUES (?,?,?,?,?)',
        [courseId,s.day_of_week,s.start_time,s.end_time,s.room||'']);
    for (const p of prerequisites)
      await conn.query('INSERT INTO prerequisites (course_id,required_course_id) VALUES (?,?)', [courseId,p]);
    await conn.commit();
    res.status(201).json({ message: 'Course created', courseId });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
};

const update = async (req, res) => {
  const { name,description,instructor,max_seats,min_year } = req.body;
  try {
    await db.query('UPDATE courses SET name=?,description=?,instructor=?,max_seats=?,min_year=? WHERE id=?',
      [name,description,instructor,max_seats,min_year,req.params.id]);
    res.json({ message: 'Course updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const remove = async (req, res) => {
  try {
    await db.query('DELETE FROM courses WHERE id=?', [req.params.id]);
    res.json({ message: 'Course deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getAll, getOne, create, update, remove };
