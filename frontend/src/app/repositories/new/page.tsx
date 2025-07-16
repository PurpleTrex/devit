'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FolderIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function NewRepository() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    initializeWithReadme: true,
    gitignoreTemplate: '',
    license: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('user_token');
      if (!token) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          isPrivate: formData.isPrivate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to the new repository
        router.push(`/repositories/${formData.name}`);
      } else {
        setError(data.message || 'Failed to create repository');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
              DevIT
            </Link>
            <nav className="hidden md:flex space-x-8 ml-10">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <span className="text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                New Repository
              </span>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FolderIcon className="h-8 w-8 mr-3 text-gray-400" />
                Create a new repository
              </h1>
              <p className="mt-2 text-gray-600">
                A repository contains all project files, including the revision history.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Repository Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Repository name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="my-awesome-project"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Great repository names are short and memorable. Need inspiration? How about{' '}
                  <span className="font-mono text-gray-700">super-disco</span>?
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="A short description of your repository"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              {/* Visibility */}
              <div>
                <fieldset>
                  <legend className="text-sm font-medium text-gray-700">Repository visibility</legend>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-start">
                      <input
                        id="public"
                        name="visibility"
                        type="radio"
                        checked={!formData.isPrivate}
                        onChange={() => handleInputChange('isPrivate', false)}
                        className="mt-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <label htmlFor="public" className="flex items-center text-sm font-medium text-gray-700">
                          <GlobeAltIcon className="h-5 w-5 mr-2 text-gray-400" />
                          Public
                        </label>
                        <p className="text-sm text-gray-500">
                          Anyone on the internet can see this repository. You choose who can commit.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <input
                        id="private"
                        name="visibility"
                        type="radio"
                        checked={formData.isPrivate}
                        onChange={() => handleInputChange('isPrivate', true)}
                        className="mt-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <label htmlFor="private" className="flex items-center text-sm font-medium text-gray-700">
                          <LockClosedIcon className="h-5 w-5 mr-2 text-gray-400" />
                          Private
                        </label>
                        <p className="text-sm text-gray-500">
                          You choose who can see and commit to this repository.
                        </p>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>

              {/* Initialize Repository */}
              <div>
                <fieldset>
                  <legend className="text-sm font-medium text-gray-700">Initialize this repository with:</legend>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center">
                      <input
                        id="readme"
                        type="checkbox"
                        checked={formData.initializeWithReadme}
                        onChange={(e) => handleInputChange('initializeWithReadme', e.target.checked)}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="readme" className="ml-2 text-sm text-gray-700">
                        Add a README file
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 ml-6">
                      This is where you can write a long description for your project.
                    </p>
                  </div>
                </fieldset>
              </div>

              {/* .gitignore Template */}
              <div>
                <label htmlFor="gitignore" className="block text-sm font-medium text-gray-700">
                  Add .gitignore template (optional)
                </label>
                <select
                  id="gitignore"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.gitignoreTemplate}
                  onChange={(e) => handleInputChange('gitignoreTemplate', e.target.value)}
                >
                  <option value="">None</option>
                  <option value="Node">Node</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="React">React</option>
                  <option value="Vue">Vue</option>
                  <option value="Go">Go</option>
                  <option value="Rust">Rust</option>
                </select>
              </div>

              {/* License */}
              <div>
                <label htmlFor="license" className="block text-sm font-medium text-gray-700">
                  Choose a license (optional)
                </label>
                <select
                  id="license"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.license}
                  onChange={(e) => handleInputChange('license', e.target.value)}
                >
                  <option value="">None</option>
                  <option value="MIT">MIT License</option>
                  <option value="Apache-2.0">Apache License 2.0</option>
                  <option value="GPL-3.0">GNU General Public License v3.0</option>
                  <option value="BSD-3-Clause">BSD 3-Clause License</option>
                  <option value="GPL-2.0">GNU General Public License v2.0</option>
                </select>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || !formData.name}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
