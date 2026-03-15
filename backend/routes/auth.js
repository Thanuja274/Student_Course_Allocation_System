const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const { register, login, me, departments } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  body('roll_number').notEmpty(),
  body('department_id').isInt(),
  body('current_year').isInt({ min: 1, max: 5 }),
], register);

router.post('/login', login);
router.get('/me', authenticate, me);
router.get('/departments', departments);

module.exports = router;
