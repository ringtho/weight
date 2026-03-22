require('dotenv').config();
const { app, connectDB } = require('./app.cjs');

const PORT = Number(process.env.SERVER_PORT || 5175);

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`)))
  .catch(err => { console.error('Failed to connect to MongoDB:', err); process.exit(1); });
