/**
 * 公开统计数据API
 * 提供不包含敏感信息的统计数据
 */

export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // 获取公开统计数据
    let stats;
    
    try {
      stats = await env.SAFETY_CONTENT.get('public_stats', { type: 'json' });
    } catch (error) {
      console.log('KV存储访问失败，使用默认统计数据:', error.message);
      stats = null;
    }
    
    // 如果没有统计数据，返回默认值
    if (!stats) {
      stats = {
        totalVisits: 0,
        totalQuizzes: 0,
        averageScore: 0,
        totalVideosWatched: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    return new Response(JSON.stringify({
      success: true,
      stats: stats
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5分钟缓存
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      stats: {
        totalVisits: 0,
        totalQuizzes: 0,
        averageScore: 0,
        totalVideosWatched: 0,
        lastUpdated: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
