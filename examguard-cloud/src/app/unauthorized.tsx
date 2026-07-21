import Link from 'next/link';

export default function Unauthorized() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="mx-auto flex max-w-[400px] flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          401 - Unauthorized
        </h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          You do not have permission to view this page. Please log in with an administrator account to continue.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700 disabled:pointer-events-none disabled:opacity-50"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
