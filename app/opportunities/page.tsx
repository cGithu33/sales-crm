'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Opportunité {
  id: string
  name: string
  company: string
  value: number
  stage: string
  closeDate: string
}

export default function Opportunités() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [opportunités, setOpportunités] = useState<Opportunité[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    const fetchOpportunités = async () => {
      try {
        const response = await fetch('/api/opportunities')
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données')
        }
        const data = await response.json()
        setOpportunités(data)
      } catch (error) {
        console.error('Erreur:', error)
        setError('Une erreur est survenue lors du chargement des opportunités')
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchOpportunités()
    }
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold">Chargement...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Opportunités</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/opportunities/scan')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Scanner carte
            </button>
            <button
              onClick={() => router.push('/opportunities/new')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Nouvelle Opportunité
            </button>
          </div>
        </div>

        {opportunités.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">Aucune opportunité trouvée. Créez votre première !</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {opportunités.map((opportunité) => (
                <li key={opportunité.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {opportunité.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {opportunité.company}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          État : {opportunité.stage}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          {opportunité.value.toLocaleString()} €
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Clôture : {new Date(opportunité.closeDate).toLocaleDateString('fr-FR')}
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
