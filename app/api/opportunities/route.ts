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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { name, company, value, stage, closeDate } = body

    if (!name || !company || !value || !stage || !closeDate) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs obligatoires' },
        { status: 400 }
      )
    }

    const data = {
      name,
      company,
      value: parseFloat(value),
      stage,
      status: stage === 'Gagné' ? 'won' : stage === 'Perdu' ? 'lost' : 'new',
      closeDate: new Date(closeDate),
      userId: session.user.id
    }

    console.log('Création opportunité:', data)

    const opportunity = await prisma.opportunity.create({ data })
    console.log('Opportunité créée:', opportunity)

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error('Erreur lors de la création de l\'opportunité:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de l\'opportunité' },
      { status: 500 }
    )
  }
}
