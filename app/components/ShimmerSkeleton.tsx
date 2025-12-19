'use client';

export default function ShimmerSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-200 p-4 overflow-hidden"
          style={{
            animation: `fadeIn 0.3s ease-out ${i * 0.05}s both`,
          }}
        >
          <div className="w-full aspect-square bg-gray-100 rounded-md mb-3 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
          </div>
          <div className="h-4 bg-gray-100 rounded mb-2 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
          </div>
          <div className="h-4 bg-gray-100 rounded w-3/4 mb-3 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
          </div>
          <div className="h-6 bg-gray-100 rounded w-1/2 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
          </div>
        </div>
      ))}
    </div>
  );
}

