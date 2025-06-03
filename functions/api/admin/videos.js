/**
 * 视频管理API
 * 提供视频信息的管理功能
 */

import { verifyAdminAuth } from './auth.js';

/**
 * 获取所有视频信息 (GET)
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify({
        success: false,
        message: authResult.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 获取视频信息
    const safetyVideo = await env.SAFETY_CONTENT.get('video_safety', { type: 'json' });
    const violationVideo = await env.SAFETY_CONTENT.get('video_violation', { type: 'json' });
    
    const videos = [];
    
    if (safetyVideo) {
      videos.push({ ...safetyVideo, id: 'safety' });
    } else {
      videos.push({
        id: 'safety',
        title: '安全操作视频',
        description: '展示正确的安全操作流程',
        url: 'https://example.com/safety-video.mp4',
        thumbnail: '/assets/images/video-thumbnails/safety.jpg',
        duration: 180,
        category: 'safety_operation',
        tags: ['安全操作', '规章制度', '标准流程'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    if (violationVideo) {
      videos.push({ ...violationVideo, id: 'violation' });
    } else {
      videos.push({
        id: 'violation',
        title: '违规操作视频',
        description: '展示违规操作的危险性',
        url: 'https://example.com/violation-video.mp4',
        thumbnail: '/assets/images/video-thumbnails/violation.jpg',
        duration: 200,
        category: 'violation_cases',
        tags: ['违规操作', '安全隐患', '事故案例'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: videos
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get videos error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取视频信息失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 更新视频信息 (PUT)
 */
export async function onRequestPut(context) {
  const { request, env } = context;
  
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify({
        success: false,
        message: authResult.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(request.url);
    const videoId = url.searchParams.get('id');
    
    if (!videoId || !['safety', 'violation'].includes(videoId)) {
      return new Response(JSON.stringify({
        success: false,
        message: '无效的视频ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updateData = await request.json();
    
    // 验证URL格式
    if (updateData.url && !isValidUrl(updateData.url)) {
      return new Response(JSON.stringify({
        success: false,
        message: '无效的视频URL格式'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 获取现有视频信息
    const storageKey = `video_${videoId}`;
    const existingVideo = await env.SAFETY_CONTENT.get(storageKey, { type: 'json' });
    
    // 创建更新后的视频信息
    const updatedVideo = {
      id: videoId,
      title: updateData.title || (existingVideo?.title) || `${videoId === 'safety' ? '安全操作' : '违规操作'}视频`,
      description: updateData.description || (existingVideo?.description) || '',
      url: updateData.url || (existingVideo?.url) || '',
      thumbnail: updateData.thumbnail || (existingVideo?.thumbnail) || '',
      duration: updateData.duration || (existingVideo?.duration) || 0,
      category: updateData.category || (existingVideo?.category) || '',
      tags: updateData.tags || (existingVideo?.tags) || [],
      createdAt: existingVideo?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 保存到KV存储
    await env.SAFETY_CONTENT.put(storageKey, JSON.stringify(updatedVideo));
    
    // 记录操作日志
    await logAdminAction(env, authResult.user.username, 'update_video', {
      videoId,
      changes: updateData
    });
    
    return new Response(JSON.stringify({
      success: true,
      data: updatedVideo,
      message: '视频信息更新成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update video error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '更新视频信息失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 验证视频URL (POST /verify)
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify({
        success: false,
        message: authResult.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { url: videoUrl } = await request.json();
    
    if (!videoUrl || !isValidUrl(videoUrl)) {
      return new Response(JSON.stringify({
        success: false,
        message: '无效的URL格式'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 尝试验证URL可访问性
    try {
      const response = await fetch(videoUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      
      const isAccessible = response.ok;
      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          url: videoUrl,
          accessible: isAccessible,
          contentType,
          contentLength: contentLength ? parseInt(contentLength) : null,
          isVideo: contentType.startsWith('video/') || videoUrl.match(/\.(mp4|webm|ogg|avi|mov)$/i)
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (fetchError) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          url: videoUrl,
          accessible: false,
          error: 'URL无法访问或响应超时'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Verify video URL error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '验证URL失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 获取视频统计信息 (GET /stats)
 */
export async function onRequestOptions(context) {
  const { request, env } = context;
  
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify({
        success: false,
        message: authResult.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 获取视频观看统计
    const stats = await env.SAFETY_CONTENT.get('video_stats', { type: 'json' }) || {
      safety: { views: 0, completions: 0, avgWatchTime: 0 },
      violation: { views: 0, completions: 0, avgWatchTime: 0 }
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get video stats error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取视频统计失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 验证URL格式
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * 记录管理员操作日志
 */
async function logAdminAction(env, username, action, details) {
  try {
    const logEntry = {
      username,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip: 'unknown' // 在实际环境中可以从request获取
    };
    
    const logKey = `admin_log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    await env.SAFETY_CONTENT.put(logKey, JSON.stringify(logEntry), {
      expirationTtl: 90 * 24 * 60 * 60 // 90天后过期
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}
