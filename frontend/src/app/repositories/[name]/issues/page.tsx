'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  PlusIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

interface Issue {
  id: string;
  number: number;
  title: string;
  body: string;
  status: 'OPEN' | 'CLOSED' | 'IN_PROGRESS';
  labels: string[];
  author: {
    id: string;
    username: string;
    fullName: string;
  };
  assignee?: {
    id: string;
    username: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
  comments: number;
}

interface Repository {
  id: string;
  name: string;
  owner: {
    username: string;
  };
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [repository, setRepository] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const params = useParams();
  const router = useRouter();
  const repoName = params.name as string;

  useEffect(() => {
    fetchRepository();
    fetchIssues();
  }, [repoName, filter]);

  const fetchRepository = async () => {
    try {
      const response = await fetch(`/api/repositories/${repoName}`);
      if (response.ok) {
        const data = await response.json();
        setRepository(data.repository);
      }
    } catch (error) {
      console.error('Failed to fetch repository:', error);
    }
  };

  const fetchIssues = async () => {
    try {
      const response = await fetch(`/api/repositories/${repoName}/issues?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-green-600 bg-green-100';
      case 'CLOSED': return 'text-red-600 bg-red-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Repository Header */}
        {repository && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <nav className="flex items-center text-sm text-gray-500 mb-4">
              <Link href="/dashboard" className="hover:text-gray-700">
                Dashboard
              </Link>
              <span className="mx-2">/</span>
              <Link href={`/repositories/${repoName}`} className="hover:text-gray-700">
                {repository.owner.username}
              </Link>
              <span className="mx-2">/</span>
              <Link href={`/repositories/${repoName}`} className="hover:text-gray-700 font-medium">
                {repository.name}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">Issues</span>
            </nav>

            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Issues</h1>
              <Link
                href={`/repositories/${repoName}/issues/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Issue
              </Link>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setFilter('all')}
                className={`text-sm font-medium ${
                  filter === 'all' 
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-2' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All Issues
              </button>
              <button
                onClick={() => setFilter('open')}
                className={`text-sm font-medium ${
                  filter === 'open' 
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-2' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Open ({issues.filter(i => i.status === 'OPEN').length})
              </button>
              <button
                onClick={() => setFilter('closed')}
                className={`text-sm font-medium ${
                  filter === 'closed' 
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-2' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Closed ({issues.filter(i => i.status === 'CLOSED').length})
              </button>
            </div>
          </div>

          {/* Issues List */}
          <div className="divide-y divide-gray-200">
            {issues.length === 0 ? (
              <div className="p-8 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
                <p className="text-gray-500 mb-4">
                  {filter === 'open' ? 'There are no open issues.' : 
                   filter === 'closed' ? 'There are no closed issues.' : 
                   'No issues have been created yet.'}
                </p>
                <Link
                  href={`/repositories/${repoName}/issues/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Issue
                </Link>
              </div>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-green-500" />
                        <Link
                          href={`/repositories/${repoName}/issues/${issue.number}`}
                          className="text-lg font-medium text-gray-900 hover:text-primary-600"
                        >
                          {issue.title}
                        </Link>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4 mb-3">
                        <span>#{issue.number}</span>
                        <span>opened {formatDate(issue.createdAt)}</span>
                        <span className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {issue.author.username}
                        </span>
                        {issue.comments > 0 && (
                          <span className="flex items-center">
                            <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                            {issue.comments} comments
                          </span>
                        )}
                      </div>

                      {issue.labels.length > 0 && (
                        <div className="flex items-center space-x-2">
                          {issue.labels.map((label, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              <TagIcon className="h-3 w-3 mr-1" />
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {issue.assignee && (
                      <div className="flex items-center text-sm text-gray-500">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <span>Assigned to {issue.assignee.username}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
