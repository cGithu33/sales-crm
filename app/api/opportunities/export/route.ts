import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/auth.config'

const prisma = new PrismaClient()

interface Filter {
  field: string
  operator: string
  value: string
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour exporter les opportunités' },
        { status: 401 }
      )
    }

    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'closeDate'
    const order = searchParams.get('order') || 'asc'
    const filtersJson = searchParams.get('filters') || '[]'
    const filters = JSON.parse(filtersJson) as Filter[]

    // Construire la requête Prisma
    let where: any = {}

    // Appliquer les filtres
    filters.forEach(filter => {
      switch (filter.field) {
        case 'name':
        case 'company':
        case 'city':
        case 'postalCode':
        case 'notes':
          where[filter.field] = filter.operator === 'contains'
            ? { contains: filter.value, mode: 'insensitive' }
            : filter.value
          break

        case 'value':
          if (filter.operator === 'gt') {
            where.value = { gt: parseFloat(filter.value) }
          } else if (filter.operator === 'lt') {
            where.value = { lt: parseFloat(filter.value) }
          } else if (filter.operator === 'between') {
            const [min, max] = filter.value.split(',').map(v => parseFloat(v.trim()))
            where.value = { gte: min, lte: max }
          } else {
            where.value = parseFloat(filter.value)
          }
          break

        case 'stage':
          where.stage = filter.value
          break

        case 'closeDate':
        case 'createdAt':
        case 'updatedAt':
          if (filter.operator === 'gt') {
            where[filter.field] = { gt: new Date(filter.value) }
          } else if (filter.operator === 'lt') {
            where[filter.field] = { lt: new Date(filter.value) }
          } else if (filter.operator === 'between') {
            const [start, end] = filter.value.split(',').map(v => new Date(v.trim()))
            where[filter.field] = { gte: start, lte: end }
          } else {
            where[filter.field] = new Date(filter.value)
          }
          break

        case 'hasImage':
          where.cardImage = filter.value === 'true'
            ? { not: null }
            : null
          break
      }
    })

    // Récupérer les opportunités filtrées et triées
    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: {
        [sort]: order
      }
    })

    return NextResponse.json(opportunities)
  } catch (error) {
    console.error('Erreur export opportunités:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export des opportunités' },
      { status: 500 }
    )
  }
}
