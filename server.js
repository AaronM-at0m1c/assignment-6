const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { body, validationResult } = require('express-validator');
const app = express();
const port = 3003;

// Middleware
app.use(express.json());

// Data validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
  
    if (!errors.isEmpty()) {
        const errorMessages =
    errors.array().map(error => error.msg);
    
        return res.status(400).json({
            error: 'Validation failed',
            messages: errorMessages
        });
    }
  
    // Set default value for completed if not provided
    if (req.body.completed === undefined) {
        req.body.completed = false;
    }
  
    next();
};

// Validation rules
const courseValidation = [
  body()
  .custom((body) => {
    if (Object.keys(body).length > 5) { // Combined with the other validators, this only allows the 5 valid fields as input
      throw new Error();
    }
    return true;
  })
    .withMessage('Request must only contain the following fields: courseCode, title, credits, description, and semester'),
  body('courseCode')
    .isLength({ min: 5 })
    .withMessage('Course-code must be at least 5 characters long'),
  
  body('title')
    .isLength({ min: 5 })
    .withMessage('Title must be at least 5 characters long'),
  
  body('credits')
    .isFloat({ min: 0 })
    .withMessage('Credits value must be a whole number'),

  body('description')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  
  body('semester')
    .matches(/^(Fall|Spring) \d{4}$/)
    .withMessage('Semester must be in the format: Spring 2025; or Fall 2021'),
];

// ID validation middleware to prevent injection
const idValidation = (field) => (req, res, next) => {
    if (!/^\d+$/.test(req.params[field])) {
        return res.status(400).json({ error: `${field} must contain digits only` });
    }
    next();
};

// Connect to university database
const db = new sqlite3.Database('./database/university.db');

// Begin REST API

// GET all courses
app.get('/api/courses', (req, res) => {
    db.all('SELECT * FROM courses', (err, rows) => {
        res.json(rows);
    });
});

// GET single course by id
app.get('/api/courses/:id', idValidation('id'), (req, res) => { 
    const id = parseInt(req.params.id); 
    db.get('SELECT * FROM courses WHERE id = ?', [id], (err, row) => { 
        res.json(row); 
    }); 
});


// POST a new course
app.post('/api/courses', courseValidation, handleValidationErrors, (req, res) => { 
    const { courseCode, title, credits, description, semester } = req.body; 
    db.run(` 
        INSERT INTO courses (courseCode, title, credits, description, semester) 
        VALUES (?, ?, ?, ?, ?) 
        `, [courseCode, title, credits, description, semester], 
        function(err) { 
            res.json({ message: `Course created with ID: ${this.lastID}` });
        }
    ); 
})

// PUT an update to a course by id
app.put('/api/courses/:id', courseValidation, handleValidationErrors, (req, res) => { 
    const id = req.params.id; 
    const { courseCode, title, credits, description, semester } = req.body; 
    db.run(` UPDATE courses SET courseCode = ?, title = ?, credits = ?, description = ?, semester = ? WHERE id = ? 
        `, [courseCode, title, credits, description, semester, id], 
        function(err) { 
            res.json({ message: `Course updated` }); 
        }
    ); 
});

// DELETE course
app.delete('/api/courses/:id', idValidation('id'), (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM courses WHERE id = ?', [id], function(err) {
        res.json({ message: 'Course deleted' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`University server running at http://localhost:${port}`);
})