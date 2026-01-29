"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      closeButton
      duration={2000}
      visibleToasts={1}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'group toast flex items-center gap-3 w-[400px] rounded-xl border-0 shadow-lg p-4 font-medium',
          success: 'bg-green-50 text-green-800',
          error: 'bg-red-50 text-red-800',
          warning: 'bg-amber-50 text-amber-800',
          info: 'bg-blue-50 text-blue-800',
          icon: 'flex-shrink-0',
          closeButton: '!absolute !top-3 !right-3 !bg-transparent !border-0 !p-1 !h-5 !w-5 hover:!opacity-70 !transition-opacity',
          title: 'flex-1 text-[15px] font-medium',
          description: 'text-sm opacity-90',
        },
      }}
      icons={{
        success: (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        ),
        error: (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        ),
        warning: (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
        ),
        info: (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
        ),
      }}
      {...props}
    />
  );
};

export { Toaster };
