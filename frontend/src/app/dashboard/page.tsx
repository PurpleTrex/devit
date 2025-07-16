'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PlusIcon,
  FolderIcon,
  StarIcon,
  EyeIcon,
  CodeBracketIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
}

interface Repository {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  isPrivate: boolean;
  updatedAt: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('user_token');
    const userData = localStorage.getItem('user_data');
    
    if (!token || !userData) {
      router.push('/auth/signin');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      fetchRepositories();
    } catch {
      router.push('/auth/signin');
    }
  }, [router]);

  const fetchRepositories = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const response = await fetch('/api/repositories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                DevIT
              </Link>
              <nav className="hidden md:flex space-x-8 ml-10">
                <Link href="/dashboard" className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/repositories" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Repositories
                </Link>
                <Link href="/explore" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Explore
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">{user.fullName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.fullName}!</h1>
          <p className="mt-2 text-gray-600">Here's what's happening with your repositories.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/repositories/new"
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 hover:bg-gray-50 rounded-lg shadow border border-gray-200"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-primary-500 text-white">
                <PlusIcon className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium">
                <span className="absolute inset-0" aria-hidden="true" />
                Create Repository
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Start a new project with version control
              </p>
            </div>
          </Link>

          <Link
            href="/repositories/import"
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 hover:bg-gray-50 rounded-lg shadow border border-gray-200"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-green-500 text-white">
                <CodeBracketIcon className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium">
                <span className="absolute inset-0" aria-hidden="true" />
                Import Repository
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Import existing code from GitHub or other sources
              </p>
            </div>
          </Link>

          <Link
            href="/teams/new"
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 hover:bg-gray-50 rounded-lg shadow border border-gray-200"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-blue-500 text-white">
                <UserGroupIcon className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium">
                <span className="absolute inset-0" aria-hidden="true" />
                Create Team
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Collaborate with others on projects
              </p>
            </div>
          </Link>
        </div>

        {/* Repositories Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Your Repositories
              </h3>
              <Link
                href="/repositories/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Repository
              </Link>
            </div>

            {repositories.length === 0 ? (
              <div className="text-center py-12">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No repositories</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new repository.
                </p>
                <div className="mt-6">
                  <Link
                    href="/repositories/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Repository
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {repositories.map((repo) => (
                  <div key={repo.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <Link 
                            href={`/repositories/${repo.name}`}
                            className="text-lg font-medium text-primary-600 hover:text-primary-800"
                          >
                            {repo.name}
                          </Link>
                          {repo.isPrivate && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Private
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{repo.description}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                            {repo.language}
                          </span>
                          <span className="flex items-center">
                            <StarIcon className="h-4 w-4 mr-1" />
                            {repo.stars}
                          </span>
                          <span className="flex items-center">
                            <CodeBracketIcon className="h-4 w-4 mr-1" />
                            {repo.forks}
                          </span>
                          <span className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Updated {repo.updatedAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
