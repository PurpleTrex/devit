'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon
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
  closedAt?: string;
}

interface Comment {
  id: string;
  body: string;
  author: {
    id: string;
    username: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function IssueDetailPage() {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const params = useParams();
  const router = useRouter();
  const repoName = params.name as string;
  const issueNumber = params.number as string;

  useEffect(() => {
    fetchIssue();
    fetchComments();
  }, [repoName, issueNumber]);

  const fetchIssue = async () => {
    try {
      const response = await fetch(`/api/repositories/${repoName}/issues/${issueNumber}`);
      if (response.ok) {
        const data = await response.json();
        setIssue(data.issue);
      } else {
        setError('Issue not found');
      }
    } catch (error) {
      setError('Failed to fetch issue');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/repositories/${repoName}/issues/${issueNumber}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommenting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/repositories/${repoName}/issues/${issueNumber}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ body: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setCommenting(false);
    }
  };

  const updateIssueStatus = async (newStatus: 'OPEN' | 'CLOSED') => {
    if (!issue) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/repositories/${repoName}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchIssue();
      }
    } catch (error) {
      console.error('Failed to update issue:', error);
    } finally {
      setUpdating(false);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Issue Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested issue could not be found.'}</p>
          <Link
            href={`/repositories/${repoName}/issues`}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to Issues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/repositories/${repoName}/issues`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Issues
            </Link>
            
            <div className="flex items-center space-x-3">
              {issue.status === 'OPEN' ? (
                <button
                  onClick={() => updateIssueStatus('CLOSED')}
                  disabled={updating}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Close Issue
                </button>
              ) : (
                <button
                  onClick={() => updateIssueStatus('OPEN')}
                  disabled={updating}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Reopen Issue
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h1 className="text-2xl font-bold text-gray-900">{issue.title}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                  {issue.status}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span className="font-medium">#{issue.number}</span>
                <span>opened {formatDate(issue.createdAt)}</span>
                <span className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {issue.author.username}
                </span>
                {issue.closedAt && (
                  <span>closed {formatDate(issue.closedAt)}</span>
                )}
              </div>
            </div>
          </div>

          {issue.labels.length > 0 && (
            <div className="flex items-center space-x-2 mt-4">
              {issue.labels.map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Issue Body */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {issue.author.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{issue.author.fullName}</p>
                <p className="text-sm text-gray-500">{formatDate(issue.createdAt)}</p>
              </div>
            </div>
            
            <div className="prose max-w-none">
              {issue.body ? (
                <div className="whitespace-pre-wrap text-gray-700">{issue.body}</div>
              ) : (
                <p className="text-gray-500 italic">No description provided.</p>
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        {comments.length > 0 && (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {comment.author.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{comment.author.fullName}</p>
                    <p className="text-sm text-gray-500">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">{comment.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add a comment</h3>
          <form onSubmit={addComment}>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Leave a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={commenting || !newComment.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {commenting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Commenting...
                  </>
                ) : (
                  'Comment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
