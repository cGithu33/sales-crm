'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Opportunité {
  id: string
  nom: string
  valeur: number
  état: string
  dateDeClôture: string
}

export default function Opportunités() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [opportunités, setOpportunités] = useState<Opportunité[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    const fetchOpportunités = async () => {
      try {
        const response = await fetch('/api/opportunities')
        const data = await response.json()
        setOpportunités(data)
      } catch (error) {
        console.error('Erreur lors de la récupération des opportunités:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchOpportunités()
    }
  }, [session])

  if (status === 'loading' || loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Opportunités</h1>
          <button
            onClick={() => router.push('/opportunities/new')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Nouvelle Opportunité
          </button>
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
                          {opportunité.nom}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          État : {opportunité.état}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          {opportunité.valeur.toLocaleString()} €
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Clôture : {new Date(opportunité.dateDeClôture).toLocaleDateString('fr-FR')}
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
