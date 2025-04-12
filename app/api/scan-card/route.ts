import { NextResponse } from 'next/server'
import { ImageAnnotatorClient } from '@google-cloud/vision'

const credentials = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL
  }
}

// Initialiser le client Vision AI avec les credentials
const vision = new ImageAnnotatorClient(credentials)

export async function POST(request: Request) {
  try {
    const { image } = await request.json()

    // Convertir l'image base64 en buffer
    const buffer = Buffer.from(image.split(',')[1], 'base64')

    // Analyser l'image avec Vision AI
    const [result] = await vision.textDetection(buffer)
    const detectedText = result.fullTextAnnotation?.text || ''

    console.log('Texte détecté:', detectedText)

    // Extraire les informations pertinentes
    const data = {
      company: extractCompany(detectedText),
      name: extractName(detectedText),
      email: extractEmail(detectedText),
      phone: extractPhone(detectedText)
    }

    console.log('Données extraites:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur analyse carte:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse de la carte' },
      { status: 500 }
    )
  }
}

function extractCompany(text: string): string {
  // Recherche la ligne qui ressemble le plus à un nom d'entreprise
  const lines = text.split('\n')
  const companyLine = lines.find(line => 
    line.toUpperCase() === line && // Tout en majuscules
    line.length > 3 && // Plus de 3 caractères
    !line.includes('@') && // Pas un email
    !line.match(/^\+?\d/) // Ne commence pas par un numéro
  )
  return companyLine || ''
}

function extractName(text: string): string {
  // Recherche un nom propre (première lettre majuscule)
  const lines = text.split('\n')
  const nameLine = lines.find(line => 
    line.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/) && // Format "Prénom Nom"
    !line.includes('@') && // Pas un email
    !line.match(/^\+?\d/) // Ne commence pas par un numéro
  )
  return nameLine || ''
}

function extractEmail(text: string): string {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/
  const match = text.match(emailRegex)
  return match ? match[0] : ''
}

function extractPhone(text: string): string {
  const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/
  const match = text.match(phoneRegex)
  return match ? match[0] : ''
}
