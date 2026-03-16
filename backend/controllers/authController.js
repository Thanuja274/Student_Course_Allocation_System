const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, roll_number, department_id, current_year, cgpa } = req.body;
  try {
    const hash = await bcrypt.hash(password, 12);
    const [r] = await db.query(
      `INSERT INTO users (name,email,password_hash,roll_number,department_id,current_year,cgpa,role)
       VALUES (?,?,?,?,?,?,?,'student')`,
      [name, email, hash, roll_number, department_id, current_year, cgpa || 0]
    );
    
    // Get the newly created user with department name
    const [rows] = await db.query(
      `SELECT u.*, d.name AS department_name
       FROM users u LEFT JOIN departments d ON d.id=u.department_id
       WHERE u.id=?`, [r.insertId]
    );
    const user = rows[0];
    
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, department_id: user.department_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role,
              roll_number: user.roll_number, department_name: user.department_name,
              current_year: user.current_year, cgpa: user.cgpa }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email or roll number already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const [rows] = await db.query(
      `SELECT u.*, d.name AS department_name
       FROM users u LEFT JOIN departments d ON d.id=u.department_id
       WHERE u.email=? AND u.is_active=1`, [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, department_id: user.department_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role,
              roll_number: user.roll_number, department_name: user.department_name,
              current_year: user.current_year, cgpa: user.cgpa }
    });
  } catch { res.status(500).json({ error: 'Server error' }); }
};

const me = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id,u.name,u.email,u.role,u.roll_number,u.current_year,u.cgpa,
              d.name AS department_name
       FROM users u LEFT JOIN departments d ON d.id=u.department_id
       WHERE u.id=?`, [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch { res.status(500).json({ error: 'Server error' }); }
};

const departments = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id,name,code FROM departments ORDER BY name');
    res.json(rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
};

module.exports = { register, login, me, departments };
