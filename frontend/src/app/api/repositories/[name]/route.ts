import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Verify JWT token middleware
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    // Verify authentication
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const repositoryName = params.name;

    // Get all repositories for the user and find the one with matching name
    const repositories = await DatabaseService.getRepositoriesByUserId(user.id);
    const repository = repositories.find((repo: any) => repo.name === repositoryName);

    if (!repository) {
      return NextResponse.json(
        { success: false, message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Transform data for frontend compatibility
    const transformedRepo = {
      id: repository.id,
      name: repository.name,
      description: repository.description,
      language: repository.language,
      stars: repository._count?.stars || 0,
      forks: repository._count?.forks || 0,
      isPrivate: repository.isPrivate,
      updatedAt: getRelativeTime(repository.updatedAt.toISOString()),
      userId: repository.ownerId,
      owner: repository.owner ? {
        id: repository.owner.id,
        username: repository.owner.username,
        fullName: repository.owner.fullName
      } : {
        id: user.id,
        username: user.username,
        fullName: user.fullName || user.username
      }
    };

    // Check if repository is starred by current user (if authenticated)
    let isStarred = false;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const authUser = jwt.verify(token, JWT_SECRET) as any;
        isStarred = await DatabaseService.isRepositoryStarred(authUser.id, repository.id);
      } catch {
        // Invalid token, continue without authentication
      }
    }

    return NextResponse.json({
      success: true,
      repository: transformedRepo,
      isStarred
    });
  } catch (error) {
    console.error('Repository fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to format relative time
function getRelativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}
