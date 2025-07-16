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

    // Get the repository
    const repositories = await DatabaseService.getRepositoriesByUserId(user.id);
    const repository = repositories.find((repo: any) => repo.name === repositoryName);

    if (!repository) {
      return NextResponse.json(
        { success: false, message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Get issues for this repository
    const issues = await DatabaseService.getIssuesByRepositoryId(repository.id);

    // Transform data for frontend compatibility
    const transformedIssues = issues.map((issue: any) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state.toLowerCase(),
      createdAt: issue.createdAt.toISOString(),
      author: {
        id: issue.author.id,
        username: issue.author.username,
        fullName: issue.author.fullName
      },
      commentsCount: issue._count?.comments || 0
    }));

    return NextResponse.json({
      success: true,
      issues: transformedIssues
    });
  } catch (error) {
    console.error('Issues fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
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
    const { title, body } = await request.json();

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Issue title is required' },
        { status: 400 }
      );
    }

    // Get the repository
    const repositories = await DatabaseService.getRepositoriesByUserId(user.id);
    const repository = repositories.find((repo: any) => repo.name === repositoryName);

    if (!repository) {
      return NextResponse.json(
        { success: false, message: 'Repository not found' },
        { status: 404 }
      );
    }

    // Create the issue
    const newIssue = await DatabaseService.createIssue({
      title,
      body: body || '',
      authorId: user.id,
      repositoryId: repository.id
    });

    return NextResponse.json({
      success: true,
      issue: {
        id: newIssue.id,
        number: newIssue.number,
        title: newIssue.title,
        body: newIssue.body,
        state: newIssue.state.toLowerCase(),
        createdAt: newIssue.createdAt.toISOString(),
        author: {
          id: newIssue.author.id,
          username: newIssue.author.username,
          fullName: newIssue.author.fullName
        }
      }
    });
  } catch (error) {
    console.error('Issue creation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
