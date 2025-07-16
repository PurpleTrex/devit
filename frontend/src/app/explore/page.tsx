'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/layout/Navigation';

interface Repository {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  language: string;
  stars: number;
  forks: number;
  updatedAt: string;
  owner: {
    name: string;
    username: string;
  };
}

interface User {
  id: string;
  name: string;
  username: string;
  bio: string;
  followers: number;
  following: number;
  repositories: number;
}

export default function ExplorePage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'repositories' | 'users'>('repositories');
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [sortBy, setSortBy] = useState<'stars' | 'updated' | 'name'>('stars');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepositories();
    fetchUsers();
  }, []);

  const fetchRepositories = async () => {
    try {
      const response = await fetch('/api/repositories/explore');
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      } else {
        console.error('Failed to fetch repositories');
        setRepositories([]);
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      setRepositories([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/explore');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users');
        setUsers([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setLoading(false);
    }
  };

  const filteredRepositories = repositories
    .filter(repo => 
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(repo => !languageFilter || repo.language === languageFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'stars':
          return b.stars - a.stars;
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const languages = Array.from(new Set(repositories.map(repo => repo.language)));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore DevIT</h1>
          <p className="text-gray-600">Discover amazing projects and talented developers</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search repositories and users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {activeTab === 'repositories' && (
              <>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Languages</option>
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="stars">Most Stars</option>
                  <option value="updated">Recently Updated</option>
                  <option value="name">Name</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('repositories')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'repositories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Repositories ({filteredRepositories.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users ({filteredUsers.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'repositories' ? (
          <div className="space-y-6">
            {filteredRepositories.map(repo => (
              <div key={repo.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Link
                        href={`/repositories/${repo.name}`}
                        className="text-xl font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {repo.owner.username}/{repo.name}
                      </Link>
                      {repo.isPrivate && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{repo.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>{repo.language}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{repo.stars}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{repo.forks}</span>
                      </div>
                      <span>Updated {formatDate(repo.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-gray-600">@{user.username}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{user.bio}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{user.followers} followers</span>
                  <span>{user.following} following</span>
                  <span>{user.repositories} repos</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {((activeTab === 'repositories' && filteredRepositories.length === 0) ||
          (activeTab === 'users' && filteredUsers.length === 0)) && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
