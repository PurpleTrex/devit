'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  PlusIcon,
  ArrowPathIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface PullRequest {
  id: string;
  number: number;
  title: string;
  body: string;
  status: 'OPEN' | 'CLOSED' | 'MERGED' | 'DRAFT';
  headBranch: string;
  baseBranch: string;
  author: {
    id: string;
    username: string;
    fullName: string;
  };
  mergeable: boolean | null;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  closedAt?: string;
  comments: number;
}

interface Repository {
  id: string;
  name: string;
  owner: {
    username: string;
  };
}

export default function PullRequestsPage() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [repository, setRepository] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'merged'>('open');
  const params = useParams();
  const router = useRouter();
  const repoName = params.name as string;

  useEffect(() => {
    fetchRepository();
    fetchPullRequests();
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

  const fetchPullRequests = async () => {
    try {
      const response = await fetch(`/api/repositories/${repoName}/pulls?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setPullRequests(data.pullRequests || []);
      }
    } catch (error) {
      console.error('Failed to fetch pull requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-green-600 bg-green-100';
      case 'MERGED': return 'text-purple-600 bg-purple-100';
      case 'CLOSED': return 'text-red-600 bg-red-100';
      case 'DRAFT': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <ArrowPathIcon className="h-5 w-5 text-green-500" />;
      case 'MERGED': return <CheckCircleIcon className="h-5 w-5 text-purple-500" />;
      case 'CLOSED': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'DRAFT': return <ArrowPathIcon className="h-5 w-5 text-gray-500" />;
      default: return <ArrowPathIcon className="h-5 w-5 text-gray-500" />;
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
              <span className="text-gray-900 font-medium">Pull Requests</span>
            </nav>

            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Pull Requests</h1>
              <Link
                href={`/repositories/${repoName}/pulls/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Pull Request
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
                All Pull Requests
              </button>
              <button
                onClick={() => setFilter('open')}
                className={`text-sm font-medium ${
                  filter === 'open' 
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-2' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Open ({pullRequests.filter(pr => pr.status === 'OPEN').length})
              </button>
              <button
                onClick={() => setFilter('merged')}
                className={`text-sm font-medium ${
                  filter === 'merged' 
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-2' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Merged ({pullRequests.filter(pr => pr.status === 'MERGED').length})
              </button>
              <button
                onClick={() => setFilter('closed')}
                className={`text-sm font-medium ${
                  filter === 'closed' 
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-2' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Closed ({pullRequests.filter(pr => pr.status === 'CLOSED').length})
              </button>
            </div>
          </div>

          {/* Pull Requests List */}
          <div className="divide-y divide-gray-200">
            {pullRequests.length === 0 ? (
              <div className="p-8 text-center">
                <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pull requests found</h3>
                <p className="text-gray-500 mb-4">
                  {filter === 'open' ? 'There are no open pull requests.' : 
                   filter === 'merged' ? 'There are no merged pull requests.' :
                   filter === 'closed' ? 'There are no closed pull requests.' : 
                   'No pull requests have been created yet.'}
                </p>
                <Link
                  href={`/repositories/${repoName}/pulls/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Pull Request
                </Link>
              </div>
            ) : (
              pullRequests.map((pr) => (
                <div key={pr.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(pr.status)}
                        <Link
                          href={`/repositories/${repoName}/pulls/${pr.number}`}
                          className="text-lg font-medium text-gray-900 hover:text-primary-600"
                        >
                          {pr.title}
                        </Link>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pr.status)}`}>
                          {pr.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4 mb-3">
                        <span>#{pr.number}</span>
                        <span>opened {formatDate(pr.createdAt)}</span>
                        <span className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {pr.author.username}
                        </span>
                        {pr.comments > 0 && (
                          <span className="flex items-center">
                            <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                            {pr.comments} comments
                          </span>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-600 space-x-2">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {pr.headBranch}
                        </span>
                        <span>→</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {pr.baseBranch}
                        </span>
                        {pr.mergeable === false && (
                          <span className="text-red-600 text-xs font-medium">
                            Conflicts
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-sm text-gray-500">
                      {pr.mergedAt && (
                        <span>merged {formatDate(pr.mergedAt)}</span>
                      )}
                      {pr.closedAt && !pr.mergedAt && (
                        <span>closed {formatDate(pr.closedAt)}</span>
                      )}
                    </div>
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
