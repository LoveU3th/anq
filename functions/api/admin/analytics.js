/**
 * 数据分析API
 * 提供学习数据的统计和分析功能
 */

import { verifyAdminAuth } from './auth.js';

/**
 * 获取分析数据概览 (GET)
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

    const url = new URL(request.url);
    const range = url.searchParams.get('range') || '30'; // 默认30天
    const type = url.searchParams.get('type') || 'overview'; // overview, users, content

    // 获取基础统计数据
    const stats = await getAnalyticsData(env, range, type);

    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取分析数据失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 获取分析数据
 */
async function getAnalyticsData(env, range, type) {
  const now = new Date();
  const rangeMs = parseInt(range) * 24 * 60 * 60 * 1000;
  const startDate = new Date(now.getTime() - rangeMs);

  // 获取存储的统计数据
  const publicStats = await env.SAFETY_CONTENT.get('public_stats', { type: 'json' }) || {};
  const videoStats = await env.SAFETY_CONTENT.get('video_stats', { type: 'json' }) || {};
  const quizStats = await env.SAFETY_CONTENT.get('quiz_stats', { type: 'json' }) || {};

  switch (type) {
    case 'overview':
      return getOverviewData(publicStats, videoStats, quizStats);
    case 'users':
      return getUserAnalytics(env, startDate, now);
    case 'content':
      return getContentAnalytics(env, startDate, now);
    default:
      return getOverviewData(publicStats, videoStats, quizStats);
  }
}

/**
 * 获取概览数据
 */
function getOverviewData(publicStats, videoStats, quizStats) {
  return {
    totalUsers: publicStats.totalVisits || 0,
    totalQuizzes: publicStats.totalQuizzes || 0,
    averageScore: Math.round(publicStats.averageScore || 0),
    completionRate: calculateCompletionRate(publicStats, quizStats),
    avgStudyTime: calculateAvgStudyTime(videoStats, quizStats),
    passRate: calculatePassRate(quizStats),
    activeUsers: Math.floor((publicStats.totalVisits || 0) * 0.3), // 估算活跃用户

    // 趋势数据（模拟）
    trends: {
      completionRate: 5.2,
      avgStudyTime: -2.1,
      passRate: 8.3,
      activeUsers: 12.5
    },

    // 用户活动数据（模拟）
    userActivity: generateUserActivityData(),

    // 设备统计数据
    deviceStats: {
      mobile: 65,
      desktop: 30,
      tablet: 5
    },

    // 学习路径数据
    learningPaths: {
      videoFirst: 70,
      quizFirst: 30
    },

    // 用户留存率
    retentionRate: {
      day1: 85,
      day7: 60,
      day30: 35
    },

    // 图表数据（模拟）
    chartData: {
      progressTrend: generateProgressTrendData(),
      accuracyDistribution: generateAccuracyDistributionData(quizStats)
    }
  };
}

/**
 * 获取用户分析数据
 */
async function getUserAnalytics(env, startDate, endDate) {
  // 在实际项目中，这里会查询用户行为日志
  // 现在返回模拟数据
  return {
    userActivity: [
      {
        userId: 'user_001',
        module: '安全操作',
        completedAt: '2024-01-20 14:30',
        score: 85,
        timeSpent: 12,
        deviceType: '移动端'
      },
      {
        userId: 'user_002',
        module: '违规识别',
        completedAt: '2024-01-20 15:45',
        score: 92,
        timeSpent: 8,
        deviceType: '桌面端'
      },
      {
        userId: 'user_003',
        module: '安全操作',
        completedAt: '2024-01-20 16:20',
        score: 78,
        timeSpent: 15,
        deviceType: '移动端'
      }
    ],

    deviceStats: {
      mobile: 65,
      desktop: 30,
      tablet: 5
    },

    learningPaths: {
      videoFirst: 70,
      quizFirst: 30
    },

    retentionRate: {
      day1: 85,
      day7: 60,
      day30: 35
    }
  };
}

/**
 * 获取内容分析数据
 */
async function getContentAnalytics(env, startDate, endDate) {
  return {
    videoPerformance: {
      safety: {
        views: 1250,
        completions: 980,
        avgWatchTime: 165,
        dropOffPoints: [30, 90, 150] // 秒
      },
      violation: {
        views: 1100,
        completions: 850,
        avgWatchTime: 180,
        dropOffPoints: [45, 120, 170]
      }
    },

    questionPerformance: await getQuestionPerformance(env),

    contentEngagement: {
      mostViewedVideo: 'safety',
      hardestQuestions: ['q_safety_005', 'q_violation_012'],
      easiestQuestions: ['q_safety_001', 'q_violation_003'],
      avgTimePerModule: {
        videoSafety: 8.5,
        videoViolation: 9.2,
        quizSafety: 6.8,
        quizViolation: 7.5
      }
    }
  };
}

/**
 * 获取题目表现数据
 */
async function getQuestionPerformance(env) {
  const safetyQuestions = await env.SAFETY_CONTENT.get('questions_safety', { type: 'json' }) || [];
  const violationQuestions = await env.SAFETY_CONTENT.get('questions_violation', { type: 'json' }) || [];

  // 模拟题目统计数据
  const questionStats = {};

  [...safetyQuestions, ...violationQuestions].forEach(question => {
    questionStats[question.id] = {
      id: question.id,
      question: question.question.substring(0, 50) + '...',
      difficulty: question.difficulty,
      correctRate: Math.random() * 40 + 60, // 60-100%
      attempts: Math.floor(Math.random() * 500) + 100,
      avgTime: Math.floor(Math.random() * 30) + 15 // 15-45秒
    };
  });

  return Object.values(questionStats);
}

/**
 * 计算完成率
 */
function calculateCompletionRate(publicStats, quizStats) {
  const totalStarts = publicStats.totalVisits || 0;
  const totalCompletions = publicStats.totalQuizzes || 0;

  if (totalStarts === 0) return 0;
  return Math.round((totalCompletions / totalStarts) * 100);
}

/**
 * 计算平均学习时长
 */
function calculateAvgStudyTime(videoStats, quizStats) {
  // 模拟计算，实际项目中会基于真实数据
  const avgVideoTime = 8.5; // 分钟
  const avgQuizTime = 7.0; // 分钟

  return Math.round(avgVideoTime + avgQuizTime);
}

/**
 * 计算通过率
 */
function calculatePassRate(quizStats) {
  // 模拟计算，实际项目中会基于真实数据
  return Math.round(Math.random() * 20 + 75); // 75-95%
}

/**
 * 生成进度趋势数据
 */
function generateProgressTrendData() {
  const data = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toISOString().split('T')[0],
      completions: Math.floor(Math.random() * 50) + 20,
      newUsers: Math.floor(Math.random() * 30) + 10
    });
  }

  return data;
}

/**
 * 生成正确率分布数据
 */
function generateAccuracyDistributionData(quizStats) {
  return [
    { range: '0-60%', count: 5 },
    { range: '60-70%', count: 12 },
    { range: '70-80%', count: 25 },
    { range: '80-90%', count: 35 },
    { range: '90-100%', count: 23 }
  ];
}

/**
 * 导出分析数据 (POST /export)
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

    const { format, range, type } = await request.json();

    // 获取数据
    const data = await getAnalyticsData(env, range || '30', type || 'overview');

    // 根据格式返回数据
    if (format === 'csv') {
      const csv = convertToCSV(data);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics_${type}_${range}days.csv"`
        }
      });
    } else {
      // 默认返回JSON
      return new Response(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="analytics_${type}_${range}days.json"`
        }
      });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '导出数据失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 生成用户活动数据
 */
function generateUserActivityData() {
  const activities = [];
  const modules = ['安全操作', '违规识别'];
  const deviceTypes = ['移动端', '桌面端'];

  for (let i = 1; i <= 20; i++) {
    const userId = `user_${String(i).padStart(3, '0')}`;
    const module = modules[Math.floor(Math.random() * modules.length)];
    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
    const score = Math.floor(Math.random() * 40) + 60; // 60-100分
    const timeSpent = Math.floor(Math.random() * 15) + 5; // 5-20分钟

    // 生成最近30天内的随机时间
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 30);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    const completedAt = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000 - randomHours * 60 * 60 * 1000 - randomMinutes * 60 * 1000);

    activities.push({
      userId,
      module,
      completedAt: completedAt.toISOString().replace('T', ' ').substring(0, 19),
      score,
      timeSpent,
      deviceType
    });
  }

  // 按完成时间排序（最新的在前）
  return activities.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

/**
 * 转换为CSV格式
 */
function convertToCSV(data) {
  // 简单的CSV转换，实际项目中可能需要更复杂的处理
  const headers = Object.keys(data);
  const values = Object.values(data).map(v =>
    typeof v === 'object' ? JSON.stringify(v) : v
  );

  return [headers.join(','), values.join(',')].join('\n');
}
