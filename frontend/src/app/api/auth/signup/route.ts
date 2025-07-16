import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DatabaseService } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export async function POST(request: NextRequest) {
  try {
    const { username, email, fullName, password } = await request.json();

    if (!username || !email || !fullName || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserByEmail = await DatabaseService.getUserByEmail(email);
    const existingUserByUsername = await DatabaseService.getUserByUsername(username);
    
    if (existingUserByEmail || existingUserByUsername) {
      return NextResponse.json(
        { success: false, message: 'User with this email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in database
    const newUser = await DatabaseService.createUser({
      username,
      email,
      fullName,
      password: hashedPassword,
    });

    // Create JWT token
    const token = jwt.sign(
      { 
        id: newUser.id,
        username: newUser.username,
        email: newUser.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
      }
    });

  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
