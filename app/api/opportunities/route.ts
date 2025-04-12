import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { options } from '../auth/[...nextauth]/options'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(options)

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const opportunities = await prisma.opportunity.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(opportunities)
  } catch (error) {
    console.error('Error fetching opportunities:', error)
    return NextResponse.json(
      { error: 'Error fetching opportunities' },
      { status: 500 }
    )
  }
}
