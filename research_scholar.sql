-- User Table
CREATE TABLE users(
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user','admin') DEFAULT 'user',
    bio TEXT,
    profile_pic VARCHAR(255), 
    reset_token VARCHAR(255) DEFAULT NULL,
    token_expiry DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 

-- Index for faster password reset
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- Papers Table
CREATE TABLE papers(
    paper_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    abstract TEXT,
    authors VARCHAR(255),
    year YEAR,
    file_url VARCHAR(255),
    uploader_id INT,
    status ENUM('pending','accepted','rejected') DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(user_id) ON DELETE CASCADE
); 

-- Favorites Table
CREATE TABLE favorites(
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    paper_id INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (paper_id) REFERENCES papers(paper_id) ON DELETE CASCADE,
    UNIQUE (user_id, paper_id)
);

-- Index for sorting favorites by date
CREATE INDEX idx_favorites_added_at ON favorites(added_at);

-- Questions Table
CREATE TABLE questions(
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    context TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Comments Table
CREATE TABLE comments(
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT,
    user_id INT,
    context TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Admin Logs Table
CREATE TABLE admin_logs(
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    action ENUM('approve','reject','delete','flag') NOT NULL,
    target_type ENUM('paper','question','comment') NOT NULL,
    target_id INT NOT NULL,
    log_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Index for speeding up queries filtering
CREATE INDEX idx_admin_logs_target ON admin_logs(target_type, target_id);   

-- Notifications Table
CREATE TABLE notifications(
    notif_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
); 

-- Tags Table
CREATE TABLE tags(
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Paper Tags
CREATE TABLE paper_tags(
    paper_id INT,
    tag_id INT,
    PRIMARY KEY (paper_id, tag_id),
    FOREIGN KEY (paper_id) REFERENCES papers(paper_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE 
);

-- Question Tags
CREATE TABLE question_tags(
    question_id INT,
    tag_id INT,
    PRIMARY KEY (question_id, tag_id),
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);

-- Password Reset Table
CREATE TABLE password_resets (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports Table
CREATE TABLE reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,  -- user who filed the report
    target_type ENUM('paper','question','comment','profile') NOT NULL,
    target_id INT NOT NULL,    -- ID of the item being reported
    reason TEXT NOT NULL,      -- reason provided by reporter
    status ENUM('pending','reviewed','resolved','dismissed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Index for faster admin review
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
