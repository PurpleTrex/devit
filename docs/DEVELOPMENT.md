# DevIT Development Guide

Welcome to DevIT! This guide will help you get started with developing this modern GitHub alternative.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Rust 1.70+** - [Install here](https://rustup.rs/)
- **Docker & Docker Compose** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

### Setup Development Environment

#### Windows
```bash
# Clone the repository
git clone <your-repo-url>
cd DevIT

# Run the setup script
.\scripts\setup-dev.bat
```

#### Linux/macOS
```bash
# Clone the repository
git clone <your-repo-url>
cd DevIT

# Make setup script executable
chmod +x scripts/setup-dev.sh

# Run the setup script
./scripts/setup-dev.sh
```

#### Manual Setup
If you prefer to set up manually:

1. **Install dependencies:**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Start infrastructure services:**
   ```bash
   docker-compose up -d postgres redis minio
   ```

3. **Set up environment variables:**
   Copy `.env.example` to `.env` and update values as needed.

4. **Build backend:**
   ```bash
   cd backend && cargo build && cd ..
   ```

### Start Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Frontend only (port 3000)
npm run dev:backend   # Backend only (port 8080)
```

## 🏗️ Project Structure

```
DevIT/
├── frontend/              # Next.js React application
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # Reusable React components
│   │   ├── lib/          # Utility functions and configs
│   │   ├── hooks/        # Custom React hooks
│   │   └── stores/       # State management (Zustand)
│   ├── public/           # Static assets
│   └── package.json
├── backend/              # Rust Actix Web API server
│   ├── src/
│   │   ├── handlers/     # HTTP request handlers
│   │   ├── models/       # Data models and types
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Custom middleware
│   │   └── utils/        # Utility functions
│   ├── migrations/       # Database migrations
│   └── Cargo.toml
├── shared/               # Shared types and utilities
├── infrastructure/       # Infrastructure as code
│   ├── database/         # Database schemas and scripts
│   ├── docker/           # Docker configurations
│   └── terraform/        # Infrastructure provisioning
├── docs/                 # Documentation
├── scripts/              # Development and deployment scripts
├── docker-compose.yml    # Local development services
└── package.json          # Root package.json for workspace
```

## 🛠️ Development Workflow

### Frontend Development

The frontend is built with:
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Apollo Client** for GraphQL
- **Monaco Editor** for code editing

Key directories:
- `src/app/` - App Router pages and layouts
- `src/components/` - Reusable UI components
- `src/lib/` - Utility functions, API clients, etc.
- `src/hooks/` - Custom React hooks
- `src/stores/` - Global state management

### Backend Development

The backend is built with:
- **Rust** with **Actix Web** framework
- **PostgreSQL** for primary database
- **Redis** for caching and sessions
- **MinIO** for object storage (S3-compatible)
- **SQLx** for database operations
- **JWT** for authentication

Key directories:
- `src/handlers/` - HTTP route handlers
- `src/models/` - Data models and database schemas
- `src/services/` - Business logic and external integrations
- `src/middleware/` - Authentication, CORS, rate limiting, etc.
- `migrations/` - Database migration files

### Database Management

We use SQLx for database operations and migrations:

```bash
# Create a new migration
sqlx migrate add create_users_table

# Run migrations
sqlx migrate run

# Revert migrations
sqlx migrate revert
```

### Testing

```bash
# Run all tests
npm test

# Frontend tests
npm run test:frontend

# Backend tests
npm run test:backend

# Watch mode
npm run test:watch
```

## 🚢 Deployment

### Docker Development

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production Deployment

DevIT supports multiple deployment strategies:

1. **Docker Swarm/Kubernetes** - For container orchestration
2. **Traditional VPS** - Direct deployment on servers
3. **Cloud Platforms** - AWS, GCP, Azure, etc.

See the `infrastructure/` directory for deployment configurations.

## 🔧 Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/devit
REDIS_URL=redis://localhost:6379

# S3/MinIO Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=devit
MINIO_SECRET_KEY=devit_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Server
HOST=0.0.0.0
PORT=8080
RUST_LOG=debug
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
NEXT_PUBLIC_APP_NAME=DevIT
NEXT_PUBLIC_APP_DESCRIPTION=A modern GitHub alternative
```

## 📚 API Documentation

The API follows RESTful conventions with some GraphQL endpoints:

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Repositories
- `GET /api/v1/repos` - List repositories
- `GET /api/v1/repos/:owner/:repo` - Get repository details
- `POST /api/v1/repos` - Create repository
- `PUT /api/v1/repos/:owner/:repo` - Update repository
- `DELETE /api/v1/repos/:owner/:repo` - Delete repository

### Issues & Pull Requests
- `GET /api/v1/repos/:owner/:repo/issues` - List issues
- `POST /api/v1/repos/:owner/:repo/issues` - Create issue
- `GET /api/v1/repos/:owner/:repo/pulls` - List pull requests
- `POST /api/v1/repos/:owner/:repo/pulls` - Create pull request

For detailed API documentation, visit `/api/docs` when running the development server.

## 🧪 Testing Strategy

### Frontend Testing
- **Unit Tests** - Jest + Testing Library
- **Component Tests** - Storybook
- **E2E Tests** - Playwright (planned)

### Backend Testing
- **Unit Tests** - Built-in Rust testing
- **Integration Tests** - Actix Test
- **API Tests** - Custom test suite

## 🐛 Debugging

### Frontend
Use React DevTools and browser developer tools. The app includes:
- Error boundaries for crash recovery
- Detailed console logging in development
- Source maps for debugging

### Backend
Use `RUST_LOG=debug` environment variable for detailed logging:
```bash
RUST_LOG=debug cargo run
```

For debugging specific modules:
```bash
RUST_LOG=devit_backend::handlers=debug cargo run
```

## 🔒 Security Considerations

- JWT tokens for authentication
- CORS properly configured
- Input validation on all endpoints
- Rate limiting implemented
- SQL injection prevention with SQLx
- XSS protection in frontend

## 📖 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For questions or issues:
- Check the GitHub Issues
- Review this documentation
- Join our Discord community (link coming soon)

## 🗺️ Roadmap

See the main README.md for the detailed roadmap and planned features.

---

Happy coding! 🚀
