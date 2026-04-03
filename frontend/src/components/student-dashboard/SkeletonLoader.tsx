import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 w-full mt-4 font-sans px-4 sm:px-6 lg:px-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-lg"></div>
          <div className="h-4 w-48 bg-slate-100 animate-pulse rounded-lg"></div>
        </div>
        <div className="h-14 w-48 bg-slate-200 animate-pulse rounded-xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Col Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-100 animate-pulse rounded-2xl"></div>
            <div className="h-32 bg-slate-100 animate-pulse rounded-2xl"></div>
            <div className="h-32 bg-slate-100 animate-pulse rounded-2xl"></div>
          </div>
          
          {/* Main big box (Search) */}
          <div className="h-[400px] bg-slate-100 animate-pulse rounded-2xl mt-8"></div>
        </div>

        {/* Right Col Skeleton */}
        <div className="space-y-6">
          <div className="h-28 bg-slate-100 animate-pulse rounded-2xl"></div>
          <div className="space-y-4">
             <div className="h-8 w-32 bg-slate-200 animate-pulse rounded-lg"></div>
             <div className="h-36 bg-slate-100 animate-pulse rounded-2xl"></div>
             <div className="h-36 bg-slate-100 animate-pulse rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
