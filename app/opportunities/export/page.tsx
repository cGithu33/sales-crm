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
  cardImage?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface Filter {
  field: string
  operator: string
  value: string
}

export default function ExportOpportunities() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<Filter[]>([])
  const [sortField, setSortField] = useState('closeDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Liste des champs disponibles pour le filtrage
  const fields = [
    { id: 'name', label: 'Nom' },
    { id: 'company', label: 'Entreprise' },
    { id: 'value', label: 'Montant' },
    { id: 'stage', label: 'État' },
    { id: 'closeDate', label: 'Date de clôture' },
    { id: 'city', label: 'Ville' },
    { id: 'postalCode', label: 'Code postal' },
    { id: 'hasImage', label: 'Photo' },
    { id: 'createdAt', label: 'Date de création' },
    { id: 'updatedAt', label: 'Date de modification' }
  ]

  // Liste des opérateurs disponibles
  const operators = [
    { id: 'contains', label: 'Contient', types: ['string'] },
    { id: 'equals', label: 'Égal à', types: ['string', 'number', 'boolean'] },
    { id: 'gt', label: 'Supérieur à', types: ['number', 'date'] },
    { id: 'lt', label: 'Inférieur à', types: ['number', 'date'] },
    { id: 'between', label: 'Entre', types: ['number', 'date'] }
  ]

  // Redirection si non authentifié
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  // Charger les opportunités
  useEffect(() => {
    const loadOpportunities = async () => {
      try {
        const response = await fetch('/api/opportunities/export?' + new URLSearchParams({
          sort: sortField,
          order: sortOrder,
          filters: JSON.stringify(filters)
        }))
        
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
  }, [sortField, sortOrder, filters])

  // Ajouter un filtre
  const addFilter = () => {
    setFilters([...filters, { field: fields[0].id, operator: operators[0].id, value: '' }])
  }

  // Supprimer un filtre
  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  // Mettre à jour un filtre
  const updateFilter = (index: number, field: string, value: string) => {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], [field]: value }
    setFilters(newFilters)
  }

  // Exporter en CSV
  const exportToCSV = () => {
    // En-têtes des colonnes
    const headers = [
      'Nom',
      'Entreprise',
      'Montant',
      'État',
      'Date de clôture',
      'Ville',
      'Code postal',
      'Photo',
      'Notes',
      'Date de création',
      'Date de modification'
    ]

    // Données des lignes
    const rows = opportunities.map(opp => [
      opp.name,
      opp.company,
      opp.value.toString(),
      opp.stage,
      new Date(opp.closeDate).toLocaleDateString('fr-FR'),
      opp.city || '',
      opp.postalCode || '',
      opp.cardImage ? 'Oui' : 'Non',
      opp.notes || '',
      new Date(opp.createdAt).toLocaleDateString('fr-FR'),
      new Date(opp.updatedAt).toLocaleDateString('fr-FR')
    ])

    // Créer le contenu CSV
    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    // Créer le blob et télécharger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `opportunites_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Export des Opportunités
          </h2>

          {/* Filtres */}
          <div className="bg-white shadow rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Filtres</h3>
              <button
                onClick={addFilter}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Ajouter un filtre
              </button>
            </div>

            {filters.map((filter, index) => (
              <div key={index} className="flex gap-4 mb-4">
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(index, 'field', e.target.value)}
                  className="rounded-md border-gray-300"
                >
                  {fields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                  className="rounded-md border-gray-300"
                >
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  placeholder="Valeur"
                  className="rounded-md border-gray-300"
                />

                <button
                  onClick={() => removeFilter(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>

          {/* Tri */}
          <div className="bg-white shadow rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium mb-4">Tri</h3>
            <div className="flex gap-4">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="rounded-md border-gray-300"
              >
                {fields.map(field => (
                  <option key={field.id} value={field.id}>
                    {field.label}
                  </option>
                ))}
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="rounded-md border-gray-300"
              >
                <option value="asc">Croissant</option>
                <option value="desc">Décroissant</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
            >
              Exporter en CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-red-600">
            {error}
          </div>
        )}

        {/* Aperçu */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entreprise
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  État
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de clôture
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {opportunity.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {opportunity.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {opportunity.value.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {opportunity.stage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(opportunity.closeDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {opportunity.cardImage ? 'Oui' : 'Non'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
