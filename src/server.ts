// src/server.ts
import 'reflect-metadata';
import { AppDataSource } from './data-source';
import app from './app';

const PORT = process.env.PORT || 3000;

// Initialize DB and start server
AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected successfully!');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });
