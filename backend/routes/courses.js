const express = require('express');
const router  = express.Router();
const C = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/',    authenticate, C.getAll);
router.get('/:id', authenticate, C.getOne);
router.post('/',   authenticate, authorize('admin'), C.create);
router.put('/:id', authenticate, authorize('admin'), C.update);
router.delete('/:id', authenticate, authorize('admin'), C.remove);

module.exports = router;
