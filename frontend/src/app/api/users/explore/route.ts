import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get all users
    const allUsers = await DatabaseService.getAllUsers();
    
    // Get repository count for each user and format for explore page
    const usersWithStats = await Promise.all(
      allUsers.map(async (user: any) => {
        const repositories = await DatabaseService.getRepositoriesByUserId(user.id);
        const followerCount = await DatabaseService.getFollowerCount(user.id);
        const followingCount = await DatabaseService.getFollowingCount(user.id);
        
        return {
          id: user.id,
          name: user.fullName,
          username: user.username,
          bio: user.bio || `Developer with ${repositories.length} repositories`,
          followers: followerCount,
          following: followingCount,
          repositories: repositories.length
        };
      })
    );

    // Sort by number of repositories (most active first)
    usersWithStats.sort((a, b) => b.repositories - a.repositories);

    return NextResponse.json({
      success: true,
      users: usersWithStats
    });
  } catch (error) {
    console.error('Explore users error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
