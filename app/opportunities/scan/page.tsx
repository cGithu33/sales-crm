'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

export default function ScanBusinessCard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Redirection si non authentifié
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  // Démarrer la caméra
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setScanning(true)
      }
    } catch (error) {
      console.error('Erreur accès caméra:', error)
      setError('Impossible d\'accéder à la caméra')
    }
  }

  // Prendre une photo
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      setProcessing(true)
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      // Capturer l'image
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context?.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convertir en base64
      const imageData = canvas.toDataURL('image/jpeg')

      // Envoyer au serveur pour OCR
      const response = await fetch('/api/scan-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse de l\'image')
      }

      const data = await response.json()
      
      // Créer l'opportunité avec les données extraites
      router.push('/opportunities/new?' + new URLSearchParams({
        company: data.company || '',
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || ''
      }))
    } catch (error) {
      console.error('Erreur capture:', error)
      setError('Erreur lors de la capture. Veuillez réessayer.')
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
              <div className="mt-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-4 relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
              {!scanning ? (
                <button
                  onClick={startCamera}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="px-4 py-2 bg-indigo-600 text-white rounded-md">
                    Activer la caméra
                  </span>
                </button>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                </>
              )}
            </div>

            {scanning && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={captureImage}
                  disabled={processing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
                >
                  {processing ? 'Analyse en cours...' : 'Prendre la photo'}
                </button>
              </div>
            )}

            <p className="mt-4 text-sm text-gray-500 text-center">
              Placez la carte de visite dans le cadre et prenez la photo
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
