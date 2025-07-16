'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CreateIssueData {
  title: string;
  body: string;
  labels: string[];
  assigneeId?: string;
}

export default function NewIssuePage() {
  const [issueData, setIssueData] = useState<CreateIssueData>({
    title: '',
    body: '',
    labels: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newLabel, setNewLabel] = useState('');
  
  const params = useParams();
  const router = useRouter();
  const repoName = params.name as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/repositories/${repoName}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(issueData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/repositories/${repoName}/issues/${data.issue.number}`);
      } else {
        setError(data.message || 'Failed to create issue');
      }
    } catch (error) {
      setError('An error occurred while creating the issue');
    } finally {
      setLoading(false);
    }
  };

  const addLabel = () => {
    if (newLabel.trim() && !issueData.labels.includes(newLabel.trim())) {
      setIssueData({
        ...issueData,
        labels: [...issueData.labels, newLabel.trim()]
      });
      setNewLabel('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setIssueData({
      ...issueData,
      labels: issueData.labels.filter(label => label !== labelToRemove)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/repositories/${repoName}/issues`}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Issues
              </Link>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">New Issue</h1>
        </div>

        {/* Create Issue Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Brief description of the issue"
                value={issueData.title}
                onChange={(e) => setIssueData({ ...issueData, title: e.target.value })}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="body"
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Provide a detailed description of the issue..."
                value={issueData.body}
                onChange={(e) => setIssueData({ ...issueData, body: e.target.value })}
              />
              <p className="mt-2 text-sm text-gray-500">
                You can use Markdown syntax to format your description.
              </p>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Labels
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Add a label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                />
                <button
                  type="button"
                  onClick={addLabel}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              
              {issueData.labels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {issueData.labels.map((label, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => removeLabel(label)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href={`/repositories/${repoName}/issues`}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !issueData.title.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Issue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
