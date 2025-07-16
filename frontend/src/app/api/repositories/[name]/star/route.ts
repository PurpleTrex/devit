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

export async function POST(
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

    // Get repository by name from the owner
    const repository = await DatabaseService.getRepositoryByName(user.username, repositoryName);

    if (!repository) {
      return NextResponse.json(
        { success: false, message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Check if already starred
    const isStarred = await DatabaseService.isRepositoryStarred(user.id, repository.id);
    if (isStarred) {
      return NextResponse.json(
        { success: false, message: 'Repository already starred' },
        { status: 400 }
      );
    }

    // Star the repository
    await DatabaseService.starRepository(user.id, repository.id);

    return NextResponse.json({
      success: true,
      message: 'Repository starred successfully'
    });
  } catch (error) {
    console.error('Star repository error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get the repository
    const repository = await DatabaseService.getRepositoryByName(user.username, repositoryName);

    if (!repository) {
      return NextResponse.json(
        { success: false, message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Check if actually starred
    const isStarred = await DatabaseService.isRepositoryStarred(user.id, repository.id);
    if (!isStarred) {
      return NextResponse.json(
        { success: false, message: 'Repository not starred' },
        { status: 400 }
      );
    }

    // Unstar the repository
    await DatabaseService.unstarRepository(user.id, repository.id);

    return NextResponse.json({
      success: true,
      message: 'Repository unstarred successfully'
    });
  } catch (error) {
    console.error('Unstar repository error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
