import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create test users
  const hashedPassword1 = await bcrypt.hash('password123', 10)
  const hashedPassword2 = await bcrypt.hash('password', 10)

  const user1 = await prisma.user.upsert({
    where: { email: 'demo@devit.com' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@devit.com',
      fullName: 'Demo User',
      password: hashedPassword1,
      status: 'ACTIVE',
      bio: 'Demo user for testing DevIT platform',
      location: 'San Francisco, CA',
      website: 'https://devit.com',
      company: 'DevIT Inc.'
    }
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'test@devit.com' },
    update: {},
    create: {
      username: 'test',
      email: 'test@devit.com',
      fullName: 'Test User',
      password: hashedPassword2,
      status: 'ACTIVE',
      bio: 'Test user for platform validation',
      location: 'New York, NY',
      company: 'Test Corp'
    }
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'jane@devit.com' },
    update: {},
    create: {
      username: 'jane',
      email: 'jane@devit.com',
      fullName: 'Jane Developer',
      password: await bcrypt.hash('secure123', 10),
      status: 'ACTIVE',
      bio: 'Full-stack developer passionate about open source',
      location: 'Austin, TX',
      company: 'Tech Startup'
    }
  })

  const user4 = await prisma.user.upsert({
    where: { email: 'alex@devit.com' },
    update: {},
    create: {
      username: 'alex',
      email: 'alex@devit.com',
      fullName: 'Alex Johnson',
      password: await bcrypt.hash('mypassword', 10),
      status: 'ACTIVE',
      bio: 'DevOps engineer and cloud architect',
      location: 'Seattle, WA',
      company: 'Cloud Solutions'
    }
  })

  console.log('✅ Created users:', { user1: user1.username, user2: user2.username, user3: user3.username, user4: user4.username })

  // Create repositories
  const repo1 = await prisma.repository.create({
    data: {
      name: 'my-awesome-project',
      description: 'A demo project showcasing modern web development',
      isPrivate: false,
      ownerId: user1.id,
      language: 'TypeScript',
      topics: ['react', 'typescript', 'web-development'],
      starCount: 42,
      forkCount: 8,
      hasIssues: true,
      hasWiki: true,
      hasPages: true
    }
  })

  const repo2 = await prisma.repository.create({
    data: {
      name: 'devit-clone',
      description: 'Learning project - building a GitHub alternative',
      isPrivate: true,
      ownerId: user1.id,
      language: 'React',
      topics: ['react', 'nextjs', 'prisma'],
      starCount: 15,
      forkCount: 3,
      hasIssues: true
    }
  })

  const repo3 = await prisma.repository.create({
    data: {
      name: 'simple-api',
      description: 'RESTful API example with authentication',
      isPrivate: false,
      ownerId: user2.id,
      language: 'Node.js',
      topics: ['nodejs', 'express', 'api'],
      starCount: 28,
      forkCount: 12,
      hasIssues: true,
      hasWiki: false
    }
  })

  const repo4 = await prisma.repository.create({
    data: {
      name: 'react-components',
      description: 'Reusable React component library',
      isPrivate: false,
      ownerId: user3.id,
      language: 'JavaScript',
      topics: ['react', 'components', 'ui'],
      starCount: 156,
      forkCount: 34,
      hasIssues: true,
      hasWiki: true
    }
  })

  const repo5 = await prisma.repository.create({
    data: {
      name: 'docker-templates',
      description: 'Collection of Docker templates for various stacks',
      isPrivate: false,
      ownerId: user4.id,
      language: 'Shell',
      topics: ['docker', 'devops', 'templates'],
      starCount: 89,
      forkCount: 23,
      hasIssues: true
    }
  })

  console.log('✅ Created repositories:', { 
    repo1: repo1.name, 
    repo2: repo2.name, 
    repo3: repo3.name,
    repo4: repo4.name,
    repo5: repo5.name
  })

  // Create some issues
  const issue1 = await prisma.issue.create({
    data: {
      number: 1,
      title: 'Add dark mode support',
      body: 'Users have requested dark mode theme support for better user experience.',
      authorId: user2.id,
      repositoryId: repo1.id,
      state: 'OPEN'
    }
  })

  const issue2 = await prisma.issue.create({
    data: {
      number: 2,
      title: 'Improve mobile responsiveness',
      body: 'The current layout needs improvements for mobile devices.',
      authorId: user3.id,
      repositoryId: repo1.id,
      state: 'OPEN'
    }
  })

  const issue3 = await prisma.issue.create({
    data: {
      number: 1,
      title: 'API rate limiting',
      body: 'Implement rate limiting to prevent abuse of the API endpoints.',
      authorId: user1.id,
      repositoryId: repo3.id,
      state: 'CLOSED',
      closedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    }
  })

  const issue4 = await prisma.issue.create({
    data: {
      number: 1,
      title: 'Add button component variants',
      body: 'Need more button variants: outline, ghost, link styles.',
      authorId: user4.id,
      repositoryId: repo4.id,
      state: 'OPEN'
    }
  })

  console.log('✅ Created issues:', { 
    issue1: issue1.title, 
    issue2: issue2.title, 
    issue3: issue3.title,
    issue4: issue4.title
  })

  // Create some stars
  await prisma.star.createMany({
    data: [
      { userId: user2.id, repositoryId: repo1.id },
      { userId: user3.id, repositoryId: repo1.id },
      { userId: user4.id, repositoryId: repo1.id },
      { userId: user1.id, repositoryId: repo3.id },
      { userId: user3.id, repositoryId: repo3.id },
      { userId: user1.id, repositoryId: repo4.id },
      { userId: user2.id, repositoryId: repo4.id },
      { userId: user4.id, repositoryId: repo4.id },
      { userId: user1.id, repositoryId: repo5.id },
      { userId: user2.id, repositoryId: repo5.id }
    ],
    skipDuplicates: true
  })

  // Create some follows
  await prisma.follow.createMany({
    data: [
      { followerId: user1.id, followingId: user2.id },
      { followerId: user1.id, followingId: user3.id },
      { followerId: user2.id, followingId: user1.id },
      { followerId: user2.id, followingId: user4.id },
      { followerId: user3.id, followingId: user1.id },
      { followerId: user3.id, followingId: user4.id },
      { followerId: user4.id, followingId: user2.id },
      { followerId: user4.id, followingId: user3.id }
    ],
    skipDuplicates: true
  })

  // Update repository counts and last activity
  await prisma.user.update({
    where: { id: user1.id },
    data: { lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000) } // 2 hours ago
  })

  await prisma.user.update({
    where: { id: user2.id },
    data: { lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 1 day ago
  })

  await prisma.user.update({
    where: { id: user3.id },
    data: { lastActive: new Date(Date.now() - 6 * 60 * 60 * 1000) } // 6 hours ago
  })

  await prisma.user.update({
    where: { id: user4.id },
    data: { lastActive: new Date(Date.now() - 30 * 60 * 1000) } // 30 minutes ago
  })

  console.log('✅ Created stars and follows')
  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
