# DevIT Database Setup Instructions

## Current Status
- ✅ All pages using real database services (no mock data)
- ✅ Explore and pricing pages created
- ✅ Complete authentication system with JWT
- ✅ Star system implemented
- ✅ Issue tracking system
- ✅ Follower/following system
- ✅ Comprehensive seed script ready

## Database Options

### Option 1: Docker PostgreSQL (Recommended for Production)
1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
2. Add Docker to your PATH:
   - Add `C:\Program Files\Docker\Docker\resources\bin` to your PATH environment variable
   - Or run commands with full path: `"C:\Program Files\Docker\Docker\resources\bin\docker.exe"`
3. Start Docker Desktop application
4. Run: `docker-compose up -d` (from the root DeviIT directory)
5. Run: `cd frontend && npm run db:push`
6. Run: `npm run db:seed`

### Option 2: Local PostgreSQL Installation
1. Install PostgreSQL from https://www.postgresql.org/download/windows/
2. Create database: `createdb devit`
3. Create user: `createuser -P devit` (password: devit_password)
4. Run: `cd frontend && npm run db:push`
5. Run: `npm run db:seed`

### Option 3: Prisma Data Platform (Cloud)
1. Go to https://cloud.prisma.io/
2. Create a new project
3. Get the connection string
4. Update .env with the new DATABASE_URL
5. Run: `cd frontend && npm run db:push`
6. Run: `npm run db:seed`

## Test Data Included in Seed
- 4 test users (demo, test, jane, alex)
- 5 repositories with different languages
- Issues, stars, and follows
- Realistic data for testing all features

## Next Steps
1. Set up database (choose option above)
2. Run seed script
3. Start frontend: `npm run dev`
4. Test login with: demo@devit.com / password123

## Production Ready Features
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Real database with Prisma ORM
- ✅ Admin panel
- ✅ Repository management
- ✅ Issue tracking
- ✅ Star/unstar functionality
- ✅ User following system
- ✅ Explore page
- ✅ Pricing page
