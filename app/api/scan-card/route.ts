import { NextResponse } from 'next/server'
import { ImageAnnotatorClient } from '@google-cloud/vision'

// Fonction pour créer le client Vision AI
async function createVisionClient() {
  try {
    // Vérifier les credentials
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
        !process.env.GOOGLE_CLOUD_CLIENT_EMAIL || 
        !process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      throw new Error('Configuration Google Cloud incomplète')
    }

    // Nettoyer la clé privée
    const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY
      .replace(/\\n/g, '\n')
      .replace(/^"|"$/g, '')

    // Créer le client avec les credentials
    return new ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: privateKey,
      },
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    })
  } catch (error) {
    console.error('Erreur création client Vision:', error)
    throw new Error('Impossible d\'initialiser Google Cloud Vision')
  }
}

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

    // Créer le client Vision AI
    console.log('Création du client Vision AI...')
    const vision = await createVisionClient()

    // Analyser l'image
    console.log('Envoi à Vision AI...')
    const [result] = await vision.textDetection({
      image: {
        content: imageBuffer.toString('base64')
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
      phone: extractPhone(detectedText),
      address: extractAddress(detectedText),
      cardImage: image // On garde l'image en base64
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
    !/^[A-Z][a-zÀ-ÿ]+(\s+[A-Z][a-zÀ-ÿ]+)+$/.test(line) && // N'est pas un nom de personne
    !line.includes('@') && // Pas un email
    !line.match(/^\+?\d/) && // Ne commence pas par un numéro
    !/^(M|Mme|Mr|Dr)\.?\s/.test(line) // N'est pas un titre
  ) || ''
}

function extractName(text: string): string {
  const lines = text.split('\n')
  
  // Rechercher d'abord les lignes qui commencent par un titre
  let name = lines.find(line => 
    /^(M|Mme|Mr|Dr)\.?\s+[A-Z][a-zÀ-ÿ]+(\s+[A-Z][a-zÀ-ÿ]+)+$/.test(line)
  )
  
  if (name) {
    // Enlever le titre si trouvé
    name = name.replace(/^(M|Mme|Mr|Dr)\.?\s+/, '')
    return name
  }

  // Sinon chercher un nom sans titre
  // Assouplir la regex pour permettre plus de variations
  return lines.find(line => {
    // Nettoyer la ligne
    const cleanLine = line.trim()
    
    // Vérifier que la ligne :
    // 1. Ne contient pas d'email
    // 2. Ne commence pas par un numéro
    // 3. N'est pas trop longue (pour éviter les phrases)
    // 4. A au moins deux mots
    // 5. Chaque mot commence par une majuscule
    if (cleanLine.includes('@') || 
        cleanLine.match(/^\+?\d/) || 
        cleanLine.length > 40 || 
        cleanLine.split(/\s+/).length < 2) {
      return false
    }

    // Vérifier que chaque mot commence par une majuscule
    const words = cleanLine.split(/\s+/)
    return words.every(word => 
      word.length > 1 && 
      /^[A-Z]/.test(word) &&
      !/^\d/.test(word)
    )
  }) || ''
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

function extractAddress(text: string): { city?: string, postalCode?: string } {
  const lines = text.split('\n')
  const result: { city?: string, postalCode?: string } = {}

  // Chercher un code postal français (5 chiffres) et la ville associée
  for (const line of lines) {
    const match = line.match(/(\d{5})\s+([A-Z][A-Za-zÀ-ÿ\s-]+)/)
    if (match) {
      result.postalCode = match[1]
      result.city = match[2].trim()
      break
    }
  }

  // Si on n'a pas trouvé, chercher juste une ville en majuscules
  if (!result.city) {
    const cityLine = lines.find(line => 
      /^[A-Z][A-Z\s-]+$/.test(line.trim()) && // Ville en majuscules
      line.length > 2 && // Plus de 2 caractères
      !/^\d/.test(line) && // Ne commence pas par un chiffre
      !line.includes('@') // N'est pas un email
    )
    if (cityLine) {
      result.city = cityLine.trim()
    }
  }

  return result
}
