import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../auth/[...nextauth]/options'

const prisma = new PrismaClient()

// Récupérer une opportunité
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à cette opportunité' },
        { status: 401 }
      )
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id }
    })

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunité non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error('Erreur récupération opportunité:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'opportunité' },
      { status: 500 }
    )
  }
}

// Mettre à jour une opportunité
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour modifier une opportunité' },
        { status: 401 }
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

    const opportunity = await prisma.opportunity.update({
      where: { id: params.id },
      data: {
        name: data.name.trim(),
        company: data.company.trim(),
        value: data.value === '' ? 0 : Number(data.value) || 0,
        stage: data.stage || 'Nouveau',
        closeDate: new Date(data.closeDate),
        notes: data.notes?.trim() || '',
        city: data.city?.trim() || '',
        postalCode: data.postalCode?.trim() || '',
        cardImage: data.cardImage || ''
      }
    })

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error('Erreur modification opportunité:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'opportunité' },
      { status: 500 }
    )
  }
}

// Supprimer une opportunité
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour supprimer une opportunité' },
        { status: 401 }
      )
    }

    await prisma.opportunity.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression opportunité:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'opportunité' },
      { status: 500 }
    )
  }
}
