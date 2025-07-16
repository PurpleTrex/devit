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

    // Get real dashboard statistics from database
    const stats = await DatabaseService.getAdminStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
