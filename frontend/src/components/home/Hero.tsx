'use client'

export function Hero() {
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            <span className="block">The Developer Platform</span>
            <span className="block text-primary-200">You've Always Wanted</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-primary-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            DevIT is a modern GitHub alternative built from the ground up for developers. 
            Fast, intuitive, and packed with the productivity tools you actually use.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <a
                href="/auth/signup"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Get Started Free
              </a>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <a
                href="/explore"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-500 hover:bg-primary-400 md:py-4 md:text-lg md:px-10"
              >
                Explore Projects
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
