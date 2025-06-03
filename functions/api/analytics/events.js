/**
 * 事件追踪API
 * 记录用户行为和统计数据
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const eventData = await request.json();
    
    // 验证事件数据
    if (!eventData.action) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required field: action'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 添加服务器端信息
    const timestamp = new Date().toISOString();
    const logEntry = {
      ...eventData,
      timestamp,
      ip: request.headers.get('CF-Connecting-IP'),
      userAgent: request.headers.get('User-Agent'),
      referer: request.headers.get('Referer')
    };
    
    // 存储事件日志
    try {
      const logKey = `event_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      await env.SAFETY_CONTENT.put(logKey, JSON.stringify(logEntry));
    } catch (error) {
      console.warn('事件日志存储失败:', error.message);
    }
    
    // 更新统计计数器
    await updateStatsCounters(env, eventData);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Event recorded successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('事件追踪失败:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to record event'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * 更新统计计数器
 * @param {Object} env - 环境变量
 * @param {Object} eventData - 事件数据
 */
async function updateStatsCounters(env, eventData) {
  try {
    // 获取当前统计数据
    let stats;
    try {
      stats = await env.SAFETY_CONTENT.get('public_stats', { type: 'json' });
    } catch (error) {
      console.log('获取统计数据失败，使用默认值:', error.message);
      stats = null;
    }
    
    if (!stats) {
      stats = {
        totalVisits: 0,
        totalQuizzes: 0,
        averageScore: 0,
        totalVideosWatched: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // 根据事件类型更新计数器
    switch (eventData.action) {
      case 'page_visit':
        stats.totalVisits = (stats.totalVisits || 0) + 1;
        break;
        
      case 'quiz_completed':
        stats.totalQuizzes = (stats.totalQuizzes || 0) + 1;
        // 更新平均分数
        if (eventData.score !== undefined) {
          const currentAvg = stats.averageScore || 0;
          const totalQuizzes = stats.totalQuizzes;
          stats.averageScore = ((currentAvg * (totalQuizzes - 1)) + eventData.score) / totalQuizzes;
          stats.averageScore = Math.round(stats.averageScore * 100) / 100; // 保留两位小数
        }
        break;
        
      case 'video_completed':
        stats.totalVideosWatched = (stats.totalVideosWatched || 0) + 1;
        break;
        
      default:
        // 其他事件类型不更新统计
        break;
    }
    
    // 更新时间戳
    stats.lastUpdated = new Date().toISOString();
    
    // 保存更新后的统计数据
    await env.SAFETY_CONTENT.put('public_stats', JSON.stringify(stats));
    
  } catch (error) {
    console.error('更新统计计数器失败:', error);
  }
}

// 处理OPTIONS请求（CORS预检）
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
