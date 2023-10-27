process.on('uncaughtException', (err) => {
  console.log('UNHANDLED EXCEPTION');
  console.log('Reason: \n');
  console.log(err);
  console.log('Shutting down everything');
  process.exit(1);
});

require('dotenv').config();
const app = require('./app.js');
const mongoose = require('mongoose');

// Connecting to the database
mongoose
  .connect(process.env.DB_STRING)
  .then(() => {
    console.log('Successfully connected to mongodb');
  })
  .catch((e) => {
    console.log('Error occured while connecting to the database');
    console.log(e);
    process.emit('unhandledRejection', e);
  });

// Listen
const server = app.listen(process.env.PORT, () => {
  console.log(`Server runnning on port ${process.env.PORT}`);
});

// unhandledRejection
process.on('unhandledRejection', (err) => {
  // Error handling
  console.log('UHANDLED REJECTION OCCURED');
  console.log('Reason: \n');
  console.log(err);

  console.log('Proccess and server is going down');
  server.close(() => {
    process.exit(1);
  });
});
