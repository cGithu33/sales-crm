'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import Image from 'next/image'

export default function NewOpportunity() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    value: '',
    stage: 'Nouveau',
    closeDate: new Date().toISOString().split('T')[0],
    notes: '',
    city: '',
    postalCode: '',
    cardImage: ''
  })

  // Redirection si non authentifié
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  // Affichage du chargement pendant la vérification de la session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold">Chargement...</div>
      </div>
    )
  }

  // Récupérer les données de l'URL et du localStorage au chargement
  useEffect(() => {
    const company = searchParams.get('company')
    const name = searchParams.get('name')
    const email = searchParams.get('email')
    const phone = searchParams.get('phone')
    const city = searchParams.get('city')
    const postalCode = searchParams.get('postalCode')
    
    // Récupérer l'image du localStorage
    let cardImage = ''
    try {
      cardImage = localStorage.getItem('tempCardImage') || ''
      // Nettoyer le localStorage après récupération
      localStorage.removeItem('tempCardImage')
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'image:', error)
    }

    setFormData(prev => ({
      ...prev,
      company: company || '',
      name: name || '',
      city: city || '',
      postalCode: postalCode || '',
      cardImage: cardImage,
      // Stocker email et téléphone dans les notes si présents
      notes: [
        email && `Email: ${email}`,
        phone && `Téléphone: ${phone}`
      ].filter(Boolean).join('\n') || ''
    }))
  }, [searchParams])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formDataToSend = {
      ...formData,
      value: parseFloat(formData.value) || 0
    }

    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataToSend),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Une erreur est survenue')
      }

      router.push('/opportunities')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      setError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Nouvelle Opportunité
            </h3>

            {formData.cardImage && (
              <div className="mt-4 relative h-48 w-full">
                <Image
                  src={formData.cardImage}
                  alt="Carte de visite"
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Entreprise
                </label>
                <input
                  type="text"
                  name="company"
                  id="company"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                    Code Postal
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                  Montant (€)
                </label>
                <input
                  type="number"
                  name="value"
                  id="value"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-gray-700">
                  État
                </label>
                <select
                  id="stage"
                  name="stage"
                  required
                  value={formData.stage}
                  onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="Nouveau">Nouveau</option>
                  <option value="Qualifié">Qualifié</option>
                  <option value="Proposition">Proposition</option>
                  <option value="Négociation">Négociation</option>
                  <option value="Gagné">Gagné</option>
                  <option value="Perdu">Perdu</option>
                </select>
              </div>

              <div>
                <label htmlFor="closeDate" className="block text-sm font-medium text-gray-700">
                  Date de clôture prévue
                </label>
                <input
                  type="date"
                  name="closeDate"
                  id="closeDate"
                  required
                  value={formData.closeDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, closeDate: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer l\'opportunité'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
