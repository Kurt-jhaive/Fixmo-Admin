"use client";

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Welcome back, Super Admin
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <span className="text-xl">🔔</span>
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">SA</span>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Super Admin</div>
              <div className="text-gray-500">admin@fixmo.com</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
