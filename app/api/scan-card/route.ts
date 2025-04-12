import { NextResponse } from 'next/server'
import { ImageAnnotatorClient } from '@google-cloud/vision'

// Initialiser le client Vision AI
const vision = new ImageAnnotatorClient()

export async function POST(request: Request) {
  try {
    const { image } = await request.json()

    // Convertir l'image base64 en buffer
    const buffer = Buffer.from(image.split(',')[1], 'base64')

    // Analyser l'image avec Vision AI
    const [result] = await vision.textDetection(buffer)
    const text = result.fullTextAnnotation?.text || ''

    // Extraire les informations pertinentes
    const data = {
      company: extractCompany(text),
      name: extractName(text),
      email: extractEmail(text),
      phone: extractPhone(text)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur analyse carte:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse de la carte' },
      { status: 500 }
    )
  }
}

// Fonctions d'extraction (à améliorer selon vos besoins)
function extractCompany(text: string): string {
  // Logique d'extraction du nom de l'entreprise
  return ''
}

function extractName(text: string): string {
  // Logique d'extraction du nom
  return ''
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
