import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, value, stage, closeDate } = body

    if (!name || !value || !stage || !closeDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        name,
        value: parseFloat(value),
        stage,
        closeDate: new Date(closeDate),
        userId: session.user.id
      }
    })

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error('Error creating opportunity:', error)
    return NextResponse.json(
      { error: 'Error creating opportunity' },
      { status: 500 }
    )
  }
}
