-- DevIT Database Schema Migration
-- This migration creates the complete database schema for DevIT

-- Create custom types
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');
CREATE TYPE repository_visibility AS ENUM ('PUBLIC', 'PRIVATE', 'INTERNAL');
CREATE TYPE issue_status AS ENUM ('OPEN', 'CLOSED', 'IN_PROGRESS');
CREATE TYPE pull_request_status AS ENUM ('OPEN', 'CLOSED', 'MERGED', 'DRAFT');

-- Drop existing tables if they exist
DROP TABLE IF EXISTS stars CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS pull_requests CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS repositories CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('user_' || lower(replace(gen_random_uuid()::text, '-', ''))),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    company VARCHAR(255),
    status user_status DEFAULT 'ACTIVE' NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_active TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create organizations table
CREATE TABLE organizations (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('org_' || lower(replace(gen_random_uuid()::text, '-', ''))),
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    website VARCHAR(255),
    location VARCHAR(255),
    email VARCHAR(255),
    owner_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create repositories table
CREATE TABLE repositories (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('repo_' || lower(replace(gen_random_uuid()::text, '-', ''))),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE NOT NULL,
    is_fork BOOLEAN DEFAULT FALSE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    owner_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id VARCHAR(30) REFERENCES organizations(id) ON DELETE CASCADE,
    default_branch VARCHAR(255) DEFAULT 'main' NOT NULL,
    language VARCHAR(100),
    topics TEXT[] DEFAULT '{}' NOT NULL,
    star_count INTEGER DEFAULT 0 NOT NULL,
    fork_count INTEGER DEFAULT 0 NOT NULL,
    watch_count INTEGER DEFAULT 0 NOT NULL,
    size BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    pushed_at TIMESTAMPTZ,
    
    UNIQUE(owner_id, name),
    UNIQUE(organization_id, name)
);

-- Create issues table
CREATE TABLE issues (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('issue_' || lower(replace(gen_random_uuid()::text, '-', ''))),
    number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    status issue_status DEFAULT 'OPEN' NOT NULL,
    repository_id VARCHAR(30) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    author_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignee_id VARCHAR(30) REFERENCES users(id) ON DELETE SET NULL,
    labels TEXT[] DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    closed_at TIMESTAMPTZ,
    
    UNIQUE(repository_id, number)
);

-- Create pull_requests table
CREATE TABLE pull_requests (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('pr_' || lower(replace(gen_random_uuid()::text, '-', ''))),
    number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    status pull_request_status DEFAULT 'OPEN' NOT NULL,
    repository_id VARCHAR(30) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    author_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    head_branch VARCHAR(255) NOT NULL,
    base_branch VARCHAR(255) NOT NULL,
    mergeable BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    merged_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    UNIQUE(repository_id, number)
);

-- Create comments table
CREATE TABLE comments (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('comment_' || lower(replace(gen_random_uuid()::text, '-', ''))),
    body TEXT NOT NULL,
    author_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue_id VARCHAR(30) REFERENCES issues(id) ON DELETE CASCADE,
    pull_request_id VARCHAR(30) REFERENCES pull_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CHECK (
        (issue_id IS NOT NULL AND pull_request_id IS NULL) OR
        (issue_id IS NULL AND pull_request_id IS NOT NULL)
    )
);

-- Create stars table
CREATE TABLE stars (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('star_' || lower(replace(gen_random_uuid()::text, '-', ''))),
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id VARCHAR(30) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, repository_id)
);

-- Create follows table
CREATE TABLE follows (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('follow_' || lower(replace(gen_random_uuid()::text, '-', ''))),
    follower_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create ssh_keys table
CREATE TABLE ssh_keys (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('key_' || lower(replace(gen_random_uuid()::text, '-', ''))),
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    key_data TEXT NOT NULL,
    fingerprint VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_used TIMESTAMPTZ
);

-- Create access_tokens table
CREATE TABLE access_tokens (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('token_' || lower(replace(gen_random_uuid()::text, '-', ''))),
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    scopes TEXT[] DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_used TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_repositories_owner ON repositories(owner_id);
CREATE INDEX idx_repositories_organization ON repositories(organization_id);
CREATE INDEX idx_repositories_name ON repositories(name);
CREATE INDEX idx_repositories_language ON repositories(language);
CREATE INDEX idx_repositories_visibility ON repositories(is_private);

CREATE INDEX idx_issues_repository ON issues(repository_id);
CREATE INDEX idx_issues_author ON issues(author_id);
CREATE INDEX idx_issues_assignee ON issues(assignee_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_number ON issues(repository_id, number);

CREATE INDEX idx_pull_requests_repository ON pull_requests(repository_id);
CREATE INDEX idx_pull_requests_author ON pull_requests(author_id);
CREATE INDEX idx_pull_requests_status ON pull_requests(status);

CREATE INDEX idx_comments_issue ON comments(issue_id);
CREATE INDEX idx_comments_pull_request ON comments(pull_request_id);
CREATE INDEX idx_comments_author ON comments(author_id);

CREATE INDEX idx_stars_user ON stars(user_id);
CREATE INDEX idx_stars_repository ON stars(repository_id);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Create functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repositories_updated_at BEFORE UPDATE ON repositories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pull_requests_updated_at BEFORE UPDATE ON pull_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update star count
CREATE OR REPLACE FUNCTION update_repository_star_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE repositories 
        SET star_count = star_count + 1 
        WHERE id = NEW.repository_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE repositories 
        SET star_count = star_count - 1 
        WHERE id = OLD.repository_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for star count updates
CREATE TRIGGER stars_insert_trigger 
    AFTER INSERT ON stars 
    FOR EACH ROW EXECUTE FUNCTION update_repository_star_count();

CREATE TRIGGER stars_delete_trigger 
    AFTER DELETE ON stars 
    FOR EACH ROW EXECUTE FUNCTION update_repository_star_count();
