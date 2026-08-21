CREATE DATABASE student;
USE student;
CREATE TABLE students(
student_id INT PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(100) NOT NULL,
email VARCHAR(100) UNIQUE NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO students (name, email)
VALUES ('Rahul', 'rahul@gmail.com'),
('Test student', 'Test@gmail.com');

CREATE TABLE questions (
    question_id INT PRIMARY KEY AUTO_INCREMENT,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attempts(
attempt_id INT PRIMARY KEY AUTO_INCREMENT,
student_id INT NOT NULL,
question_id INT NOT NULL,
answer TEXT NOT NULL,
reasoning TEXT,
is_correct BOOLEAN,
hesitation_seconds DECIMAL(6,2),
revision_count INT DEFAULT 0,
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(student_id) REFERENCES students(student_id),
FOREIGN KEY(question_id) REFERENCES questions(question_id),
CHECK (hesitation_seconds IS NULL OR hesitation_seconds >= 0),
    CHECK (revision_count >= 0)
);

CREATE TABLE misconceptions (
    misconception_id INT PRIMARY KEY AUTO_INCREMENT,
    attempt_id INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    confidence DECIMAL(3,2),
    CHECK (confidence >= 0.00 AND confidence <= 1.00), -- confidence decimals --
    skill_area VARCHAR(100),

    FOREIGN KEY (attempt_id) REFERENCES attempts(attempt_id) ON DELETE RESTRICT
);

CREATE TABLE follow_up_questions (
    followup_id INT PRIMARY KEY AUTO_INCREMENT,
    misconception_id INT NOT NULL,
    question_text TEXT NOT NULL,
    expected_concept VARCHAR(150),
    difficulty VARCHAR(20),

    FOREIGN KEY (misconception_id)
        REFERENCES misconceptions(misconception_id)
);

CREATE TABLE follow_up_attempts (
    followup_attempt_id INT PRIMARY KEY AUTO_INCREMENT,
    followup_id INT NOT NULL,
    attempt_id INT NOT NULL,
    student_id INT NOT NULL,
    answer TEXT NOT NULL,
    reasoning TEXT,
    is_correct BOOLEAN,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (followup_id)
        REFERENCES follow_up_questions(followup_id)
        ON DELETE CASCADE,

    FOREIGN KEY (attempt_id)
        REFERENCES attempts(attempt_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE RESTRICT
);

