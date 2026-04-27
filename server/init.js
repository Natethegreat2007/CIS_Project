require('dotenv').config();
const { initializeDatabase } = require('./bootstrap');

initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed.');
    console.error(error);
    process.exit(1);
  });
