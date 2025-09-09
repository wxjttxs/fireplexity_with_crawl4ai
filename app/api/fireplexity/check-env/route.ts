import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasCrawl4aiService: true // Always true since we're using local service
  })
}