import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-admin-key';

// Verify admin token middleware
function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.isAdmin ? decoded : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get real users from database
    const users = await DatabaseService.getAllUsers();
    
    // Transform data for frontend compatibility
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      status: user.status.toLowerCase(),
      createdAt: new Date(user.createdAt).toISOString().split('T')[0],
      lastActive: getRelativeTime(user.lastActive),
      repositoryCount: user._count.repositories,
    }));

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      total: transformedUsers.length,
    });
  } catch (error) {
    console.error('Admin users error:', error);
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
