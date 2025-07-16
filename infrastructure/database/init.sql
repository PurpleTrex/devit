-- Initial database schema for DevIT

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar_url VARCHAR(500),
    website_url VARCHAR(500),
    location VARCHAR(255),
    billing_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member', -- owner, admin, member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Repositories table
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) UNIQUE NOT NULL, -- owner/repo-name
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT FALSE,
    is_fork BOOLEAN DEFAULT FALSE,
    fork_parent_id UUID REFERENCES repositories(id) ON DELETE SET NULL,
    default_branch VARCHAR(100) DEFAULT 'main',
    clone_url VARCHAR(500),
    ssh_url VARCHAR(500),
    homepage_url VARCHAR(500),
    language VARCHAR(50),
    size_kb BIGINT DEFAULT 0,
    stars_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    watchers_count INTEGER DEFAULT 0,
    open_issues_count INTEGER DEFAULT 0,
    has_issues BOOLEAN DEFAULT TRUE,
    has_projects BOOLEAN DEFAULT TRUE,
    has_wiki BOOLEAN DEFAULT TRUE,
    has_pages BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    disabled BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(20) DEFAULT 'public', -- public, private, internal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pushed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repository collaborators
CREATE TABLE repository_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(20) NOT NULL DEFAULT 'read', -- read, write, admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repository_id, user_id)
);

-- Issues table
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number SERIAL NOT NULL,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    body TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    state VARCHAR(20) DEFAULT 'open', -- open, closed
    locked BOOLEAN DEFAULT FALSE,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(repository_id, number)
);

-- Pull requests table
CREATE TABLE pull_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number SERIAL NOT NULL,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    body TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    head_branch VARCHAR(255) NOT NULL,
    base_branch VARCHAR(255) NOT NULL,
    head_sha VARCHAR(40) NOT NULL,
    base_sha VARCHAR(40) NOT NULL,
    state VARCHAR(20) DEFAULT 'open', -- open, closed, merged
    draft BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    mergeable BOOLEAN,
    merged BOOLEAN DEFAULT FALSE,
    merged_at TIMESTAMP WITH TIME ZONE,
    merged_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    comments_count INTEGER DEFAULT 0,
    review_comments_count INTEGER DEFAULT 0,
    commits_count INTEGER DEFAULT 0,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    changed_files INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(repository_id, number)
);

-- Milestones table
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    state VARCHAR(20) DEFAULT 'open', -- open, closed
    due_on TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Labels table
CREATE TABLE labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(6) NOT NULL, -- hex color without #
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(repository_id, name)
);

-- Issue labels (many-to-many)
CREATE TABLE issue_labels (
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (issue_id, label_id)
);

-- PR labels (many-to-many)
CREATE TABLE pull_request_labels (
    pull_request_id UUID NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (pull_request_id, label_id)
);

-- Comments table (for issues and PRs)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    pull_request_id UUID REFERENCES pull_requests(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((issue_id IS NOT NULL) OR (pull_request_id IS NOT NULL))
);

-- Stars table
CREATE TABLE stars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, repository_id)
);

-- Watches table
CREATE TABLE watches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    subscribed BOOLEAN DEFAULT TRUE,
    ignored BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, repository_id)
);

-- Forks table
CREATE TABLE forks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    forked_repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, repository_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_repositories_owner_id ON repositories(owner_id);
CREATE INDEX idx_repositories_organization_id ON repositories(organization_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);
CREATE INDEX idx_issues_repository_id ON issues(repository_id);
CREATE INDEX idx_issues_author_id ON issues(author_id);
CREATE INDEX idx_issues_state ON issues(state);
CREATE INDEX idx_pull_requests_repository_id ON pull_requests(repository_id);
CREATE INDEX idx_pull_requests_author_id ON pull_requests(author_id);
CREATE INDEX idx_pull_requests_state ON pull_requests(state);
CREATE INDEX idx_comments_issue_id ON comments(issue_id);
CREATE INDEX idx_comments_pull_request_id ON comments(pull_request_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_stars_user_id ON stars(user_id);
CREATE INDEX idx_stars_repository_id ON stars(repository_id);
CREATE INDEX idx_watches_user_id ON watches(user_id);
CREATE INDEX idx_watches_repository_id ON watches(repository_id);
