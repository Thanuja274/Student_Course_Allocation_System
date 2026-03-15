require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const app = express();

app.use(cors({ origin: ['http://localhost:3000','http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200,
  message: { error: 'Too many requests' } }));

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/courses',     require('./routes/courses'));
app.use('/api/preferences', require('./routes/preferences'));
app.use('/api/allocation',  require('./routes/allocation'));
app.use('/api/admin',       require('./routes/admin'));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health\n`);
});
