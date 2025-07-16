-- Initial MySQL migration for DevIT
-- Create database and tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(30) PRIMARY KEY DEFAULT (CONCAT('user_', REPLACE(UUID(), '-', ''))),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    website_url VARCHAR(500),
    location VARCHAR(255),
    company VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(30) PRIMARY KEY DEFAULT (CONCAT('org_', REPLACE(UUID(), '-', ''))),
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    website VARCHAR(255),
    location VARCHAR(255),
    email VARCHAR(255),
    owner_id VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Repositories table
CREATE TABLE IF NOT EXISTS repositories (
    id VARCHAR(30) PRIMARY KEY DEFAULT (CONCAT('repo_', REPLACE(UUID(), '-', ''))),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE NOT NULL,
    is_fork BOOLEAN DEFAULT FALSE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    owner_id VARCHAR(30) NOT NULL,
    organization_id VARCHAR(30),
    default_branch VARCHAR(255) DEFAULT 'main' NOT NULL,
    language VARCHAR(100),
    star_count INTEGER DEFAULT 0 NOT NULL,
    fork_count INTEGER DEFAULT 0 NOT NULL,
    watch_count INTEGER DEFAULT 0 NOT NULL,
    size BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    pushed_at TIMESTAMP NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_owner_repo (owner_id, name),
    UNIQUE KEY unique_org_repo (organization_id, name)
);

-- Issues table  
CREATE TABLE IF NOT EXISTS issues (
    id VARCHAR(30) PRIMARY KEY DEFAULT (CONCAT('issue_', REPLACE(UUID(), '-', ''))),
    number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    status ENUM('OPEN', 'CLOSED', 'IN_PROGRESS') DEFAULT 'OPEN' NOT NULL,
    repository_id VARCHAR(30) NOT NULL,
    author_id VARCHAR(30) NOT NULL,
    assignee_id VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_repo_issue (repository_id, number)
);

-- Pull requests table
CREATE TABLE IF NOT EXISTS pull_requests (
    id VARCHAR(30) PRIMARY KEY DEFAULT (CONCAT('pr_', REPLACE(UUID(), '-', ''))),
    number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    status ENUM('OPEN', 'CLOSED', 'MERGED', 'DRAFT') DEFAULT 'OPEN' NOT NULL,
    repository_id VARCHAR(30) NOT NULL,
    author_id VARCHAR(30) NOT NULL,
    head_branch VARCHAR(255) NOT NULL,
    base_branch VARCHAR(255) NOT NULL,
    is_merged BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    merged_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_repo_pr (repository_id, number)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(30) PRIMARY KEY DEFAULT (CONCAT('comment_', REPLACE(UUID(), '-', ''))),
    body TEXT NOT NULL,
    author_id VARCHAR(30) NOT NULL,
    issue_id VARCHAR(30),
    pull_request_id VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
    FOREIGN KEY (pull_request_id) REFERENCES pull_requests(id) ON DELETE CASCADE
);

-- Stars table (for starring repositories)
CREATE TABLE IF NOT EXISTS stars (
    id VARCHAR(30) PRIMARY KEY DEFAULT (CONCAT('star_', REPLACE(UUID(), '-', ''))),
    user_id VARCHAR(30) NOT NULL,
    repository_id VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_star (user_id, repository_id)
);

-- Follows table (for following users)
CREATE TABLE IF NOT EXISTS follows (
    id VARCHAR(30) PRIMARY KEY DEFAULT (CONCAT('follow_', REPLACE(UUID(), '-', ''))),
    follower_id VARCHAR(30) NOT NULL,
    following_id VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id)
);
