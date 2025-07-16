'use client';

import { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  FolderIcon, 
  BugAntIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalUsers: number;
  totalRepositories: number;
  totalIssues: number;
  activeUsers: number;
  userGrowth: number;
  repoGrowth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Users',
      stat: stats?.totalUsers || 0,
      icon: UsersIcon,
      change: stats?.userGrowth || 0,
      changeType: (stats?.userGrowth || 0) >= 0 ? 'increase' : 'decrease',
    },
    {
      name: 'Repositories',
      stat: stats?.totalRepositories || 0,
      icon: FolderIcon,
      change: stats?.repoGrowth || 0,
      changeType: (stats?.repoGrowth || 0) >= 0 ? 'increase' : 'decrease',
    },
    {
      name: 'Open Issues',
      stat: stats?.totalIssues || 0,
      icon: BugAntIcon,
      change: 0,
      changeType: 'neutral',
    },
    {
      name: 'Active Users',
      stat: stats?.activeUsers || 0,
      icon: ChartBarIcon,
      change: 0,
      changeType: 'neutral',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your DevIT platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{item.stat}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                {item.change !== 0 && (
                  <span className={`flex items-center ${
                    item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.changeType === 'increase' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(item.change)}% from last month
                  </span>
                )}
                {item.change === 0 && (
                  <span className="text-gray-500">No change</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent User Registrations
            </h3>
            <div className="mt-5">
              <div className="flow-root">
                <ul className="-mb-8">
                  {[1, 2, 3, 4].map((item, idx) => (
                    <li key={item}>
                      <div className="relative pb-8">
                        {idx !== 3 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                              <UsersIcon className="h-5 w-5 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                New user <span className="font-medium text-gray-900">user{item}</span> registered
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time>{item}h ago</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              System Health
            </h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Database</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Redis Cache</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">File Storage</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">API Server</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
