"use client";

import { useRBAC } from "@/lib/useRBAC";

interface ViewOnlyBannerProps {
  module: string;
}

export function ViewOnlyBanner({ module }: ViewOnlyBannerProps) {
  const { isViewOnly, hasAccess } = useRBAC(module);

  if (!hasAccess) return null;
  if (!isViewOnly) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-blue-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-700 font-medium">
            <strong>View-Only Access:</strong> You have read-only permissions for this module. You cannot create, edit, or delete items.
          </p>
        </div>
      </div>
    </div>
  );
}
