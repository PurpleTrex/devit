import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Verify JWT token
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

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's repositories from database
    const repositories = await DatabaseService.getRepositoriesByUserId(user.id);
    
    // Transform data for frontend compatibility
    const transformedRepos = repositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo._count.stars,
      forks: repo._count.forks,
      isPrivate: repo.isPrivate,
      updatedAt: getRelativeTime(repo.updatedAt.toISOString()),
      userId: repo.ownerId,
    }));

    return NextResponse.json({
      success: true,
      repositories: transformedRepos,
    });
  } catch (error) {
    console.error('Repositories error:', error);
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

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description, isPrivate = false } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Repository name is required' },
        { status: 400 }
      );
    }

    // Check if repository name already exists for this user
    const existingUser = await DatabaseService.getUserById(user.id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const existingRepos = await DatabaseService.getRepositoriesByUserId(user.id);
    const existingRepo = existingRepos.find((repo: any) => repo.name === name);
    if (existingRepo) {
      return NextResponse.json(
        { success: false, message: 'Repository with this name already exists' },
        { status: 409 }
      );
    }

    // Create new repository in database
    const newRepository = await DatabaseService.createRepository({
      name,
      description: description || '',
      isPrivate,
      ownerId: user.id,
      language: 'Unknown'
    });

    return NextResponse.json({
      success: true,
      repository: newRepository,
    });
  } catch (error) {
    console.error('Create repository error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
