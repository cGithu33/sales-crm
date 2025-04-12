import { NextResponse } from 'next/server'
import { ImageAnnotatorClient } from '@google-cloud/vision'

// Fonction pour nettoyer la clé privée
function cleanPrivateKey(key: string | undefined): string {
  if (!key) throw new Error('La clé privée Google Cloud est manquante')
  return key
    .replace(/\\n/g, '\n')
    .replace(/\s+/g, '\n')
    .replace(/^"|"$/g, '')
}

// Initialiser le client Vision AI avec les credentials
const vision = new ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: cleanPrivateKey(process.env.GOOGLE_CLOUD_PRIVATE_KEY)
  },
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
})

export async function POST(request: Request) {
  try {
    console.log('Début de l\'analyse de la carte...')
    const { image } = await request.json()

    if (!image) {
      console.error('Pas d\'image reçue')
      throw new Error('Aucune image n\'a été fournie')
    }

    // Vérifier que l'image est au format base64
    if (!image.startsWith('data:image/')) {
      console.error('Format d\'image invalide')
      throw new Error('Format d\'image invalide')
    }

    // Extraire les données base64
    const base64Data = image.split(',')[1]
    if (!base64Data) {
      console.error('Données base64 invalides')
      throw new Error('Format d\'image invalide')
    }

    // Convertir en buffer
    const imageBuffer = Buffer.from(base64Data, 'base64')
    console.log('Taille du buffer:', imageBuffer.length, 'bytes')

    // Vérifier les credentials
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
        !process.env.GOOGLE_CLOUD_CLIENT_EMAIL || 
        !process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      throw new Error('Configuration Google Cloud incomplète')
    }

    // Analyser l'image
    console.log('Envoi à Vision AI...')
    const [result] = await vision.textDetection({
      image: {
        content: imageBuffer
      }
    })

    if (!result || !result.fullTextAnnotation) {
      console.error('Pas de texte détecté')
      throw new Error('Aucun texte n\'a été détecté dans l\'image')
    }

    const detectedText = result.fullTextAnnotation.text || ''
    console.log('Texte détecté:', detectedText)

    // Extraire les informations
    const data = {
      company: extractCompany(detectedText),
      name: extractName(detectedText),
      email: extractEmail(detectedText),
      phone: extractPhone(detectedText)
    }

    console.log('Données extraites:', data)

    if (!data.company && !data.name && !data.email && !data.phone) {
      throw new Error('Aucune information pertinente n\'a pu être extraite de l\'image')
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur complète:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Erreur lors de l\'analyse de la carte'
      },
      { status: 500 }
    )
  }
}

function extractCompany(text: string): string {
  const lines = text.split('\n')
  return lines.find(line => 
    line.length > 3 &&
    /[A-Z]/.test(line) && // Contient au moins une majuscule
    !line.includes('@') && // Pas un email
    !line.match(/^\+?\d/) && // Ne commence pas par un numéro
    !/^(M|Mme|Mr|Dr)\.?\s/.test(line) // N'est pas un titre
  ) || ''
}

function extractName(text: string): string {
  const lines = text.split('\n')
  return lines.find(line => 
    line.match(/^[A-Z][a-zÀ-ÿ]+(\s+[A-Z][a-zÀ-ÿ]+)+$/) && // Format "Prénom Nom" avec accents
    !line.includes('@') && // Pas un email
    !line.match(/^\+?\d/) // Ne commence pas par un numéro
  ) || ''
}

function extractEmail(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  const match = text.match(emailRegex)
  return match ? match[0].toLowerCase() : ''
}

function extractPhone(text: string): string {
  // Regex pour les numéros de téléphone français
  const phoneRegex = /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/
  const match = text.match(phoneRegex)
  return match ? match[0].replace(/[\s.-]/g, '') : ''
}
