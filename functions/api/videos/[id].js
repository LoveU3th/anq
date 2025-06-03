/**
 * 视频信息API
 * 获取指定视频的元数据信息
 */

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const videoId = params.id;
  
  try {
    // 验证视频ID
    if (!videoId || typeof videoId !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid video ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 从KV存储获取视频信息
    let videoData;
    try {
      videoData = await env.SAFETY_CONTENT.get(`video_${videoId}`, { type: 'json' });
    } catch (error) {
      console.log('KV存储访问失败，使用默认视频数据:', error.message);
      videoData = null;
    }
    
    // 如果KV中没有数据，返回默认视频信息
    if (!videoData) {
      videoData = getDefaultVideoData(videoId);
    }
    
    if (!videoData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Video not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      video: videoData
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1小时缓存
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('获取视频信息失败:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
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
 * 获取默认视频数据
 * @param {string} videoId - 视频ID
 * @returns {Object|null} - 视频数据或null
 */
function getDefaultVideoData(videoId) {
  const defaultVideos = {
    safety: {
      id: 'safety',
      title: '你的选择决定安全分界-遵守规章制度-安全',
      description: '展示正确安全操作流程的教育视频，帮助学习者了解标准的安全作业程序。',
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      thumbnail: '/assets/images/video-thumbnails/safety-video.jpg',
      duration: 180, // 3分钟
      category: 'safety_operation',
      tags: ['安全操作', '规章制度', '标准流程'],
      createdAt: '2024-01-15T08:30:00Z',
      updatedAt: '2024-01-20T14:20:00Z'
    },
    violation: {
      id: 'violation',
      title: '你的选择决定安全分界-违规操作-不安全',
      description: '展示违规操作的危险性和后果，警示学习者避免不安全行为。',
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      thumbnail: '/assets/images/video-thumbnails/violation-video.jpg',
      duration: 200, // 3分20秒
      category: 'safety_violation',
      tags: ['违规操作', '安全警示', '事故预防'],
      createdAt: '2024-01-15T08:30:00Z',
      updatedAt: '2024-01-20T14:20:00Z'
    }
  };
  
  return defaultVideos[videoId] || null;
}

// 处理OPTIONS请求（CORS预检）
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
