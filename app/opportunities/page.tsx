'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Opportunity {
  id: string
  name: string
  value: number
  stage: string
  closeDate: string
}

export default function Opportunities() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/api/opportunities')
        const data = await response.json()
        setOpportunities(data)
      } catch (error) {
        console.error('Error fetching opportunities:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchOpportunities()
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
          <button
            onClick={() => router.push('/opportunities/new')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            New Opportunity
          </button>
        </div>

        {opportunities.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No opportunities found. Create your first one!</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {opportunities.map((opportunity) => (
                <li key={opportunity.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {opportunity.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Stage: {opportunity.stage}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          ${opportunity.value.toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Close: {new Date(opportunity.closeDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
