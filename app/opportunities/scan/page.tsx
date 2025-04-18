'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

export default function ScanBusinessCard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  // Redirection si non authentifié
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  // Fonction pour redimensionner l'image
  const resizeImage = async (base64Image: string, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          // Calculer les nouvelles dimensions
          let width = img.width
          let height = img.height
          
          if (width > maxWidth) {
            height = Math.floor(height * (maxWidth / width))
            width = maxWidth
          }

          // Créer un canvas pour le redimensionnement
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Impossible de créer le contexte canvas'))
            return
          }

          // Fond blanc
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, width, height)
          
          // Dessiner l'image redimensionnée
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convertir en JPEG avec compression
          const resizedImage = canvas.toDataURL('image/jpeg', 0.7)
          console.log('Image redimensionnée :', Math.round(resizedImage.length / 1024), 'KB')
          resolve(resizedImage)
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'))
      img.src = base64Image
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setProcessing(true)
      setError('')

      console.log('Fichier sélectionné:', file.name, 'taille:', Math.round(file.size / 1024), 'KB')

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image')
      }

      // Vérifier la taille du fichier
      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('L\'image est trop volumineuse. Maximum 10MB.')
      }

      // Convertir l'image en base64
      const originalBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
        reader.readAsDataURL(file)
      })

      // Redimensionner l'image
      console.log('Redimensionnement de l\'image...')
      const resizedBase64 = await resizeImage(originalBase64)

      console.log('Envoi de la requête à /api/scan-card...')

      // Envoyer au serveur pour OCR
      const response = await fetch('/api/scan-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: resizedBase64
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'analyse de l\'image')
      }

      const data = await response.json()
      console.log('Données extraites avec succès')

      // Stocker l'image dans le localStorage
      try {
        localStorage.setItem('tempCardImage', resizedBase64)
      } catch (error) {
        console.error('Erreur lors du stockage de l\'image:', error)
        // Continuer même si le stockage échoue
      }

      // Rediriger vers le formulaire avec les données (sans l'image dans l'URL)
      router.push('/opportunities/new?' + new URLSearchParams({
        company: data.company || '',
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        city: data.address?.city || '',
        postalCode: data.address?.postalCode || ''
      }))
    } catch (error) {
      console.error('Erreur complète:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'analyse. Veuillez réessayer')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Scanner une carte de visite
            </h2>
            
            {error && (
              <div className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
                {error}
              </div>
            )}

            <div className="mt-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                className="w-full px-4 py-8 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex flex-col items-center justify-center space-y-2"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyse en cours...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Prendre une photo</span>
                  </>
                )}
              </button>

              <p className="mt-4 text-sm text-gray-500 text-center">
                Prenez une photo claire de la carte de visite.<br />
                Taille maximale : 10MB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
