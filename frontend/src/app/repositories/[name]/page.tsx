'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  StarIcon,
  EyeIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Repository {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  isPrivate: boolean;
  updatedAt: string;
  userId: string;
  owner: {
    id: string;
    username: string;
    fullName: string;
  };
}

interface Issue {
  id: string;
  number: number;
  title: string;
  state: string;
  createdAt: string;
  author: {
    username: string;
  };
}

export default function RepositoryView() {
  const [repository, setRepository] = useState<Repository | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const router = useRouter();
  const params = useParams();
  const repoName = params.name as string;

  useEffect(() => {
    if (repoName) {
      fetchRepository();
      fetchIssues();
    }
  }, [repoName]);

  const fetchRepository = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch(`/api/repositories/${repoName}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRepository(data.repository);
        setIsStarred(data.isStarred || false);
      } else if (response.status === 404) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch repository:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;

      const response = await fetch(`/api/repositories/${repoName}/issues`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    }
  };

  const handleStar = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;

      const response = await fetch(`/api/repositories/${repoName}/star`, {
        method: isStarred ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsStarred(!isStarred);
        if (repository) {
          setRepository({
            ...repository,
            stars: repository.stars + (isStarred ? -1 : 1)
          });
        }
      }
    } catch (error) {
      console.error('Failed to star repository:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Repository not found</h1>
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
                DevIT
              </Link>
              <nav className="hidden md:flex space-x-8 ml-10">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Repository Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {repository.isPrivate ? (
                <LockClosedIcon className="h-6 w-6 text-gray-400 mr-2" />
              ) : (
                <GlobeAltIcon className="h-6 w-6 text-gray-400 mr-2" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  <Link href={`/users/${repository.owner.username}`} className="text-primary-600 hover:text-primary-700">
                    {repository.owner.username}
                  </Link>
                  <span className="text-gray-500"> / </span>
                  {repository.name}
                </h1>
                {repository.description && (
                  <p className="text-gray-600 mt-2">{repository.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleStar}
                className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                  isStarred 
                    ? 'border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                {isStarred ? (
                  <StarIconSolid className="h-4 w-4 mr-2" />
                ) : (
                  <StarIcon className="h-4 w-4 mr-2" />
                )}
                {isStarred ? 'Starred' : 'Star'}
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {repository.stars}
                </span>
              </button>
            </div>
          </div>

          {/* Repository Stats */}
          <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-500">
              <CodeBracketIcon className="h-4 w-4 mr-1" />
              {repository.language || 'Unknown'}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <StarIcon className="h-4 w-4 mr-1" />
              {repository.stars} stars
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <CodeBracketIcon className="h-4 w-4 mr-1" />
              {repository.forks} forks
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              Updated {repository.updatedAt}
            </div>
          </div>
        </div>

        {/* Repository Navigation Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <Link
                href={`/repositories/${repoName}`}
                className="py-4 px-1 border-b-2 border-primary-500 text-primary-600 font-medium text-sm"
              >
                Code
              </Link>
              <Link
                href={`/repositories/${repoName}/issues`}
                className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                Issues
                {issues.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {issues.filter(i => i.state === 'open').length}
                  </span>
                )}
              </Link>
              <Link
                href={`/repositories/${repoName}/pulls`}
                className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                Pull Requests
              </Link>
              <Link
                href={`/repositories/${repoName}/settings`}
                className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>

        {/* Repository Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Code Tab */}
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button className="border-b-2 border-primary-500 py-4 px-6 text-sm font-medium text-primary-600">
                    Code
                  </button>
                  <button className="py-4 px-6 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Issues ({issues.length})
                  </button>
                  <button className="py-4 px-6 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Pull requests
                  </button>
                </nav>
              </div>
              
              <div className="p-6">
                <div className="text-center py-12">
                  <CodeBracketIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No files yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start by creating a new file or uploading existing files.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Create new file
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* About */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">About</h3>
              {repository.description ? (
                <p className="text-gray-600 text-sm">{repository.description}</p>
              ) : (
                <p className="text-gray-500 text-sm italic">No description provided.</p>
              )}
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <CodeBracketIcon className="h-4 w-4 mr-2" />
                  {repository.language || 'Unknown'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <StarIcon className="h-4 w-4 mr-2" />
                  {repository.stars} stars
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  {repository.forks} watching
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CodeBracketIcon className="h-4 w-4 mr-2" />
                  {repository.forks} forks
                </div>
              </div>
            </div>

            {/* Recent Issues */}
            {issues.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Issues</h3>
                <div className="space-y-3">
                  {issues.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="flex items-start">
                      <ExclamationTriangleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {issue.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          #{issue.number} by {issue.author.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
