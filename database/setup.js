const sqlite3 = require('sqlite3').verbose();

// Connect to database file - creates a db file if it does not yet exist
const db = new sqlite3.Database('./database/university.db');
console.log('Connected to university database');

// Create university.db courses table schema
db.run(`
  CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseCode TEXT,
    title TEXT,
    credits INTEGER,
    description TEXT,
    semester TEXT
  )
`);

console.log('Courses table created');