import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Admin credentials (in production, store these securely in environment variables)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123', // Change this!
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-admin-key';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate credentials
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // Create admin token
      const token = jwt.sign(
        { 
          id: 'admin-1',
          username: username,
          role: 'admin',
          isAdmin: true 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: 'admin-1',
          username: username,
          role: 'Administrator'
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
