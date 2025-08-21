import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL
    const directUrl = process.env.DIRECT_DATABASE_URL
    
    return NextResponse.json({
      success: true,
      debug: {
        hasDbUrl: !!dbUrl,
        hasDirectUrl: !!directUrl,
        dbUrlPrefix: dbUrl ? dbUrl.substring(0, 50) + '...' : 'undefined',
        directUrlPrefix: directUrl ? directUrl.substring(0, 50) + '...' : 'undefined',
        // 显示更多调试信息
        dbUrlLength: dbUrl?.length || 0,
        directUrlLength: directUrl?.length || 0,
        isDbUrlWorking: dbUrl?.includes('postgres:J9DjoUaCjqy4RDOK@db.hlevlzengatwhnlapkza.supabase.co:5432'),
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}