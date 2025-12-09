const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors(config.cors));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SUPFile API is running' });
});

// API Routes (à implémenter)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/files', require('./routes/files'));
// app.use('/api/folders', require('./routes/folders'));
// app.use('/api/share', require('./routes/share'));
// app.use('/api/search', require('./routes/search'));
// app.use('/api/dashboard', require('./routes/dashboard'));

// Error handling middleware (à développer)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  console.log(`✓ SUPFile API listening on http://${HOST}:${PORT}`);
  console.log(`✓ Environment: ${config.server.nodeEnv}`);
});

module.exports = app;
