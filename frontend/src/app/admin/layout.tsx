'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  FolderIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

interface AdminUser {
  id: string;
  username: string;
  role: string;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Repositories', href: '/admin/repositories', icon: FolderIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/admin/settings', icon: CogIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip authentication check for login page
    if (pathname === '/admin/login') {
      return;
    }

    // Check admin authentication
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    
    if (!token || !user) {
      router.push('/admin/login');
      return;
    }

    try {
      setAdminUser(JSON.parse(user));
    } catch {
      router.push('/admin/login');
    }
  }, [router, pathname]);

  // Show login page without layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navigation={navigation} adminUser={adminUser} onLogout={handleLogout} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent navigation={navigation} adminUser={adminUser} onLogout={handleLogout} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ 
  navigation, 
  adminUser, 
  onLogout 
}: { 
  navigation: any[];
  adminUser: AdminUser;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <ShieldCheckIcon className="h-8 w-8 text-red-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">DevIT Admin</span>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
            >
              <item.icon className="text-gray-400 mr-3 flex-shrink-0 h-6 w-6" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {adminUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700">{adminUser.username}</p>
              <p className="text-xs font-medium text-gray-500">{adminUser.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="ml-3 inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
