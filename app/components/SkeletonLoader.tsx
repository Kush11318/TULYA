'use client';

export default function SkeletonLoader() {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full border-collapse border border-black dark:border-white min-w-[800px]">
        <thead>
          <tr className="bg-black dark:bg-white text-white dark:text-black">
            <th className="border border-black dark:border-white p-4 text-left">Image</th>
            <th className="border border-black dark:border-white p-4 text-left">Product</th>
            <th className="border border-black dark:border-white p-4 text-left">Site</th>
            <th className="border border-black dark:border-white p-4 text-right">Price</th>
            <th className="border border-black dark:border-white p-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2].map((i) => (
            <tr key={i} className="border border-black dark:border-white">
              <td className="border border-black dark:border-white p-4">
                <div className="w-20 h-20 border border-black dark:border-white bg-white dark:bg-black"></div>
              </td>
              <td className="border border-black dark:border-white p-4">
                <div className="h-4 w-48 border border-black dark:border-white bg-white dark:bg-black mb-2"></div>
                <div className="h-4 w-32 border border-black dark:border-white bg-white dark:bg-black"></div>
              </td>
              <td className="border border-black dark:border-white p-4">
                <div className="h-4 w-20 border border-black dark:border-white bg-white dark:bg-black"></div>
              </td>
              <td className="border border-black dark:border-white p-4">
                <div className="h-6 w-24 border border-black dark:border-white bg-white dark:bg-black ml-auto"></div>
              </td>
              <td className="border border-black dark:border-white p-4">
                <div className="h-8 w-16 border border-black dark:border-white bg-white dark:bg-black mx-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

