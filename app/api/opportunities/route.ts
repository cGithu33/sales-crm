import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const opportunities = await prisma.opportunity.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(opportunities)
  } catch (error) {
    console.error('Erreur lors de la récupération des opportunités:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des opportunités' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour créer une opportunité' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const data = await request.json()
    
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      )
    }

    if (!data.company?.trim()) {
      return NextResponse.json(
        { error: 'L\'entreprise est requise' },
        { status: 400 }
      )
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        name: data.name.trim(),
        company: data.company.trim(),
        value: data.value === '' ? 0 : Number(data.value) || 0,
        stage: data.stage || 'Nouveau',
        closeDate: new Date(data.closeDate),
        notes: data.notes?.trim() || '',
        city: data.city?.trim() || '',
        postalCode: data.postalCode?.trim() || '',
        cardImage: data.cardImage || '',
        userId: user.id
      }
    })

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error('Erreur création opportunité:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'opportunité' },
      { status: 500 }
    )
  }
}
