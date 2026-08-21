USE student;


INSERT INTO questions
(subject, topic, question_text, correct_answer, difficulty)
VALUES
(
    'Mathematics',
    'Linear Equations',
    'Solve 2x + 6 = 14.',
    '4',
    'Easy'
),
(
    'Mathematics',
    'Linear Equations',
    'Solve 3x - 9 = 12.',
    '7',
    'Easy'
),
(
    'Mathematics',
    'Linear Equations',
    'Solve 5x + 10 = 35.',
    '5',
    'Easy'
),
(
    'Mathematics',
    'Linear Equations',
    'Solve 4x - 7 = 21.',
    '7',
    'Easy'
),
(
    'Mathematics',
    'Linear Equations',
    'Solve 3(x + 4) = 21.',
    '3',
    'Medium'
);


-- -------------------------
-- MATHEMATICS
-- Quadratic Equations
-- -------------------------

INSERT INTO questions
(subject, topic, question_text, correct_answer, difficulty)
VALUES
(
    'Mathematics',
    'Quadratic Equations',
    'Solve x^2 - 5x + 6 = 0.',
    '2, 3',
    'Medium'
),
(
    'Mathematics',
    'Quadratic Equations',
    'Solve x^2 - 9 = 0.',
    '-3, 3',
    'Easy'
),
(
    'Mathematics',
    'Quadratic Equations',
    'Solve x^2 + 5x + 6 = 0.',
    '-2, -3',
    'Medium'
);


-- -------------------------
-- MATHEMATICS
-- Percentages
-- -------------------------

INSERT INTO questions
(subject, topic, question_text, correct_answer, difficulty)
VALUES
(
    'Mathematics',
    'Percentages',
    'What is 20 percent of 150?',
    '30',
    'Easy'
),
(
    'Mathematics',
    'Percentages',
    'A price of 500 is increased by 10 percent. What is the new price?',
    '550',
    'Easy'
),
(
    'Mathematics',
    'Percentages',
    'A number is increased from 80 to 100. What is the percentage increase?',
    '25%',
    'Medium'
);


-- =========================================================
-- PHYSICS
-- =========================================================

INSERT INTO questions
(subject, topic, question_text, correct_answer, difficulty)
VALUES
(
    'Physics',
    'Motion',
    'A car travels 100 metres in 5 seconds. What is its average speed?',
    '20 m/s',
    'Easy'
),
(
    'Physics',
    'Motion',
    'An object starts from rest and accelerates at 2 m/s^2 for 5 seconds. What is its final velocity?',
    '10 m/s',
    'Easy'
),
(
    'Physics',
    'Force',
    'A 5 kg object experiences a force of 20 N. What is its acceleration?',
    '4 m/s^2',
    'Easy'
),
(
    'Physics',
    'Work and Energy',
    'A force of 10 N moves an object 5 metres in the direction of the force. How much work is done?',
    '50 J',
    'Easy'
);


-- =========================================================
-- CHEMISTRY
-- =========================================================

INSERT INTO questions
(subject, topic, question_text, correct_answer, difficulty)
VALUES
(
    'Chemistry',
    'Atomic Structure',
    'How many protons are present in a carbon atom?',
    '6',
    'Easy'
),
(
    'Chemistry',
    'Moles',
    'How many moles are present in 18 grams of water? Assume molar mass of water is 18 g/mol.',
    '1 mole',
    'Easy'
),
(
    'Chemistry',
    'Periodic Table',
    'What is the atomic number of oxygen?',
    '8',
    'Easy'
);


-- =========================================================
-- COMPUTER SCIENCE
-- =========================================================

INSERT INTO questions
(subject, topic, question_text, correct_answer, difficulty)
VALUES
(
    'Computer Science',
    'Programming',
    'What is the time complexity of binary search on a sorted array?',
    'O(log n)',
    'Medium'
),
(
    'Computer Science',
    'Data Structures',
    'Which data structure follows the LIFO principle?',
    'Stack',
    'Easy'
),
(
    'Computer Science',
    'Data Structures',
    'Which data structure follows the FIFO principle?',
    'Queue',
    'Easy'
),
(
    'Computer Science',
    'Algorithms',
    'What is the worst-case time complexity of linear search?',
    'O(n)',
    'Easy'
);

SELECT * FROM students;
SELECT * FROM questions;
SHOW TABLES;
