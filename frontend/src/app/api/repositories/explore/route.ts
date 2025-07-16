import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get all public repositories from all users with star counts
    const publicRepositories = await prisma.repository.findMany({
      where: {
        isPrivate: false
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      },
      orderBy: [
        { starCount: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Transform repositories to match frontend interface
    const transformedRepos = publicRepositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      isPrivate: repo.isPrivate,
      language: repo.language,
      stars: repo.starCount,
      forks: repo.forkCount,
      updatedAt: repo.updatedAt.toISOString(),
      owner: {
        name: repo.owner?.fullName || repo.owner?.username || 'Unknown',
        username: repo.owner?.username || 'unknown'
      }
    }))

    return NextResponse.json({
      success: true,
      repositories: transformedRepos
    });
  } catch (error) {
    console.error('Explore repositories error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
