const { PrismaClient } = require('@prisma/client')

async function testConnections() {
  console.log('🔍 开始连接测试...\n')
  
  // 测试1：连接池格式
  console.log('1️⃣ 测试连接池格式...')
  const poolClient = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres.hlevlzengatwhnlapkza:J9DjoUaCjqy4RDOK@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
      }
    }
  })
  
  try {
    await poolClient.$connect()
    const memberCount = await poolClient.member.count()
    console.log(`✅ 连接池格式成功！会员数量: ${memberCount}`)
    await poolClient.$disconnect()
  } catch (error) {
    console.log(`❌ 连接池格式失败:`, error.message)
  }
  
  console.log('')
  
  // 测试2：直连格式（旧用户名格式）
  console.log('2️⃣ 测试直连格式（旧用户名）...')
  const directClient = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:J9DjoUaCjqy4RDOK@db.hlevlzengatwhnlapkza.supabase.co:5432/postgres'
      }
    }
  })
  
  try {
    await directClient.$connect()
    const memberCount = await directClient.member.count()
    console.log(`✅ 直连格式（旧用户名）成功！会员数量: ${memberCount}`)
    await directClient.$disconnect()
  } catch (error) {
    console.log(`❌ 直连格式（旧用户名）失败:`, error.message)
  }
  
  console.log('')
  
  // 测试3：直连格式（新用户名格式）
  console.log('3️⃣ 测试直连格式（新用户名）...')
  const directNewClient = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres.hlevlzengatwhnlapkza:J9DjoUaCjqy4RDOK@db.hlevlzengatwhnlapkza.supabase.co:5432/postgres'
      }
    }
  })
  
  try {
    await directNewClient.$connect()
    const memberCount = await directNewClient.member.count()
    console.log(`✅ 直连格式（新用户名）成功！会员数量: ${memberCount}`)
    await directNewClient.$disconnect()
  } catch (error) {
    console.log(`❌ 直连格式（新用户名）失败:`, error.message)
  }
  
  console.log('\n🎯 测试完成！')
}

testConnections().catch(console.error)