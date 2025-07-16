
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prisma = globalThis.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma

// Database service functions
export class DatabaseService {
  static async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true,
        lastActive: true,
        _count: {
          select: {
            repositories: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true,
        lastActive: true,
        _count: {
          select: {
            repositories: true,
            followers: true,
            following: true
          }
        }
      }
    })
  }

  static async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        _count: {
          select: {
            repositories: true
          }
        }
      }
    })
  }

  static async getUserByUsername(username: string) {
    return await prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            repositories: true
          }
        }
      }
    })
  }

  static async createUser(userData: {
    username: string
    email: string
    fullName: string
    password: string
  }) {
    return await prisma.user.create({
      data: userData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true
      }
    })
  }

  static async updateUser(id: string, updates: any) {
    return await prisma.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        status: true,
        lastActive: true
      }
    })
  }

  static async updateUserLastActive(id: string) {
    return await prisma.user.update({
      where: { id },
      data: { lastActive: new Date() },
      select: {
        id: true,
        lastActive: true
      }
    })
  }

  // Repository methods
  static async getAllRepositories() {
    return await prisma.repository.findMany({
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        _count: {
          select: {
            stars: true,
            forks: true,
            issues: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async getRepositoriesByUserId(userId: string) {
    return await prisma.repository.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: {
            stars: true,
            forks: true,
            issues: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
  }

  static async createRepository(repositoryData: {
    name: string
    description?: string
    isPrivate: boolean
    ownerId: string
    language?: string
  }) {
    return await prisma.repository.create({
      data: repositoryData,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    })
  }

  static async updateRepository(id: string, updates: any) {
    return await prisma.repository.update({
      where: { id },
      data: updates,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    })
  }

  static async deleteRepository(id: string) {
    return await prisma.repository.delete({
      where: { id }
    })
  }

  // Statistics methods
  static async getAdminStats() {
    const [userCount, repositoryCount, issueCount] = await Promise.all([
      prisma.user.count(),
      prisma.repository.count(),
      prisma.issue.count()
    ])

    return {
      userCount,
      repositoryCount,
      issueCount
    }
  }

  // Star management methods
  static async isRepositoryStarred(userId: string, repositoryId: string) {
    const star = await prisma.star.findUnique({
      where: {
        userId_repositoryId: {
          userId,
          repositoryId
        }
      }
    })
    return !!star
  }

  static async starRepository(userId: string, repositoryId: string) {
    // Create star record
    const star = await prisma.star.create({
      data: {
        userId,
        repositoryId
      }
    })

    // Update repository star count
    await prisma.repository.update({
      where: { id: repositoryId },
      data: {
        starCount: {
          increment: 1
        }
      }
    })

    return star
  }

  static async unstarRepository(userId: string, repositoryId: string) {
    // Delete star record
    await prisma.star.delete({
      where: {
        userId_repositoryId: {
          userId,
          repositoryId
        }
      }
    })

    // Update repository star count
    await prisma.repository.update({
      where: { id: repositoryId },
      data: {
        starCount: {
          decrement: 1
        }
      }
    })
  }

  static async getRepositoryByName(ownerUsername: string, repositoryName: string) {
    return await prisma.repository.findFirst({
      where: {
        name: repositoryName,
        owner: {
          username: ownerUsername
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    })
  }

  // Issue management methods
  static async getIssuesByRepositoryId(repositoryId: string) {
    return await prisma.issue.findMany({
      where: {
        repositoryId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  static async createIssue(issueData: {
    title: string
    body: string
    authorId: string
    repositoryId: string
  }) {
    // Get the next issue number for this repository
    const lastIssue = await prisma.issue.findFirst({
      where: {
        repositoryId: issueData.repositoryId
      },
      orderBy: {
        number: 'desc'
      }
    })

    const nextNumber = (lastIssue?.number || 0) + 1

    // Create the issue
    const issue = await prisma.issue.create({
      data: {
        ...issueData,
        number: nextNumber
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    })

    // Update repository open issues count
    await prisma.repository.update({
      where: { id: issueData.repositoryId },
      data: {
        openIssuesCount: {
          increment: 1
        }
      }
    })

    return issue
  }

  // Follower/Following methods
  static async getFollowerCount(userId: string) {
    return await prisma.follow.count({
      where: {
        followingId: userId
      }
    })
  }

  static async getFollowingCount(userId: string) {
    return await prisma.follow.count({
      where: {
        followerId: userId
      }
    })
  }
}
