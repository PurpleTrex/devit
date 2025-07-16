'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
}

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        // Invalid user data, clear it
        localStorage.removeItem('user_data')
        localStorage.removeItem('user_token')
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_data')
    setUser(null)
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                DevIT
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/explore"
                className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium"
              >
                Explore
              </Link>
              <Link
                href="/pricing"
                className="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium"
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Search repositories..."
                  type="search"
                />
              </div>
            </div>
          </div>

          {/* Right side navigation */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              type="button"
              className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">View notifications</span>
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5m0-5h5l-5-5m-5-5h5l-5-5m0 5h5l-5 5"
                />
              </svg>
            </button>

            {/* User menu */}
            <div className="ml-3 relative">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
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
                  {/* Discrete admin link */}
                  <Link
                    href="/admin/login"
                    className="text-xs text-gray-400 hover:text-gray-500 px-2 py-2 rounded-md"
                    title="Admin Access"
                  >
                    🛡️
                  </Link>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    href="/auth/signin"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign up
                  </Link>
                  {/* Discrete admin link */}
                  <Link
                    href="/admin/login"
                    className="text-xs text-gray-400 hover:text-gray-500 px-2 py-2 rounded-md"
                    title="Admin Access"
                  >
                    🛡️
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/explore"
              className="text-gray-500 hover:text-gray-700 block px-3 py-2 rounded-md text-base font-medium"
            >
              Explore
            </Link>
            <Link
              href="/pricing"
              className="text-gray-500 hover:text-gray-700 block px-3 py-2 rounded-md text-base font-medium"
            >
              Pricing
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              {user ? (
                <div className="space-y-3 w-full">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">{user.fullName}</span>
                  </div>
                  <div className="space-y-1">
                    <Link
                      href="/dashboard"
                      className="block text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium text-left w-full"
                    >
                      Sign out
                    </button>
                    <Link
                      href="/admin/login"
                      className="block text-xs text-gray-400 hover:text-gray-500 px-3 py-2 rounded-md"
                      title="Admin Access"
                    >
                      🛡️ Admin
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Link
                    href="/auth/signin"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign up
                  </Link>
                  {/* Discrete admin link */}
                  <Link
                    href="/admin/login"
                    className="text-xs text-gray-400 hover:text-gray-500 px-2 py-2 rounded-md"
                    title="Admin Access"
                  >
                    🛡️
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
