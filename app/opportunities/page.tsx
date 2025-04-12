'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Opportunity {
  id: string
  name: string
  company: string
  value: number
  stage: string
  closeDate: string
  city?: string
  postalCode?: string
}

export default function Opportunities() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Redirection si non authentifié
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  // Charger les opportunités
  useEffect(() => {
    const loadOpportunities = async () => {
      try {
        const response = await fetch('/api/opportunities')
        if (!response.ok) {
          throw new Error('Impossible de charger les opportunités')
        }
        const data = await response.json()
        setOpportunities(data)
      } catch (error) {
        console.error('Erreur:', error)
        setError('Impossible de charger les opportunités')
      } finally {
        setLoading(false)
      }
    }

    loadOpportunities()
  }, [])

  // Affichage du chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Opportunités
          </h2>
          <div className="flex space-x-4">
            <Link
              href="/opportunities/scan"
              className="bg-indigo-600 px-4 py-2 rounded-md text-white text-sm font-medium hover:bg-indigo-700"
            >
              Scanner une carte
            </Link>
            <Link
              href="/opportunities/new"
              className="bg-indigo-600 px-4 py-2 rounded-md text-white text-sm font-medium hover:bg-indigo-700"
            >
              Nouvelle opportunité
            </Link>
            <Link
              href="/opportunities/export"
              className="bg-green-600 px-4 py-2 rounded-md text-white text-sm font-medium hover:bg-green-700"
            >
              Exporter
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {opportunities.map((opportunity) => (
              <li key={opportunity.id}>
                <Link
                  href={`/opportunities/${opportunity.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {opportunity.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {opportunity.company}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm font-medium text-gray-900">
                          {opportunity.value.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {opportunity.stage}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        {(opportunity.city || opportunity.postalCode) && (
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {[opportunity.city, opportunity.postalCode].filter(Boolean).join(' ')}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <p>
                          {new Date(opportunity.closeDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
