import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function POST() {
  try {
    const value = await redis.incr('page_views')
    return NextResponse.json({ value: Number(value) })
  } catch (err) {
    return NextResponse.json({ error: 'increment_failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const value = await redis.get('page_views')
    return NextResponse.json({ value: Number(value ?? 0) })
  } catch (err) {
    return NextResponse.json({ value: 0 }, { status: 500 })
  }
}
