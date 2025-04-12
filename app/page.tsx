import { getServerSession } from 'next-auth'
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Sales CRM</h1>
        {session ? (
          <Link
            href="/opportunities"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            View Opportunities
          </Link>
        ) : (
          <Link
            href="/api/auth/signin"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign In
          </Link>
        )}
      </div>
    </main>
  )
}
