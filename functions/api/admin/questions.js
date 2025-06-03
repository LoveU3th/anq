/**
 * 题库管理API
 * 提供题目的增删改查功能
 */

import { verifyAdminAuth } from './auth.js';

/**
 * 获取所有题目 (GET)
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
    
    // 获取查询参数
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const difficulty = url.searchParams.get('difficulty');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // 获取题库数据
    const safetyQuestions = await env.SAFETY_CONTENT.get('questions_safety', { type: 'json' }) || [];
    const violationQuestions = await env.SAFETY_CONTENT.get('questions_violation', { type: 'json' }) || [];
    
    let allQuestions = [
      ...safetyQuestions.map(q => ({ ...q, type: 'safety' })),
      ...violationQuestions.map(q => ({ ...q, type: 'violation' }))
    ];
    
    // 应用筛选
    if (type) {
      allQuestions = allQuestions.filter(q => q.type === type);
    }
    
    if (difficulty) {
      allQuestions = allQuestions.filter(q => q.difficulty === parseInt(difficulty));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      allQuestions = allQuestions.filter(q => 
        q.question.toLowerCase().includes(searchLower) ||
        q.category?.toLowerCase().includes(searchLower) ||
        q.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // 分页
    const total = allQuestions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedQuestions = allQuestions.slice(startIndex, endIndex);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        questions: paginatedQuestions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Get questions error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '获取题目失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 创建新题目 (POST)
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
    
    const questionData = await request.json();
    
    // 验证必填字段
    if (!questionData.question || !questionData.options || !questionData.correctAnswer || !questionData.type) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少必填字段'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 生成题目ID
    const questionId = `q_${questionData.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建题目对象
    const newQuestion = {
      id: questionId,
      question: questionData.question,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation || '',
      difficulty: questionData.difficulty || 1,
      category: questionData.category || '未分类',
      tags: questionData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: authResult.user.username
    };
    
    // 获取现有题库
    const storageKey = `questions_${questionData.type}`;
    const existingQuestions = await env.SAFETY_CONTENT.get(storageKey, { type: 'json' }) || [];
    
    // 添加新题目
    existingQuestions.push(newQuestion);
    
    // 保存到KV存储
    await env.SAFETY_CONTENT.put(storageKey, JSON.stringify(existingQuestions));
    
    return new Response(JSON.stringify({
      success: true,
      data: newQuestion,
      message: '题目创建成功'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Create question error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '创建题目失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 更新题目 (PUT)
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
    const questionId = url.searchParams.get('id');
    
    if (!questionId) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少题目ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updateData = await request.json();
    
    // 查找题目
    const safetyQuestions = await env.SAFETY_CONTENT.get('questions_safety', { type: 'json' }) || [];
    const violationQuestions = await env.SAFETY_CONTENT.get('questions_violation', { type: 'json' }) || [];
    
    let questionFound = false;
    let questionType = '';
    
    // 在安全题库中查找
    const safetyIndex = safetyQuestions.findIndex(q => q.id === questionId);
    if (safetyIndex !== -1) {
      questionFound = true;
      questionType = 'safety';
      
      // 更新题目
      safetyQuestions[safetyIndex] = {
        ...safetyQuestions[safetyIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      // 保存更新
      await env.SAFETY_CONTENT.put('questions_safety', JSON.stringify(safetyQuestions));
    } else {
      // 在违规题库中查找
      const violationIndex = violationQuestions.findIndex(q => q.id === questionId);
      if (violationIndex !== -1) {
        questionFound = true;
        questionType = 'violation';
        
        // 更新题目
        violationQuestions[violationIndex] = {
          ...violationQuestions[violationIndex],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        
        // 保存更新
        await env.SAFETY_CONTENT.put('questions_violation', JSON.stringify(violationQuestions));
      }
    }
    
    if (!questionFound) {
      return new Response(JSON.stringify({
        success: false,
        message: '题目不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: '题目更新成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update question error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '更新题目失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 删除题目 (DELETE)
 */
export async function onRequestDelete(context) {
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
    const questionId = url.searchParams.get('id');
    
    if (!questionId) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少题目ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 查找并删除题目
    const safetyQuestions = await env.SAFETY_CONTENT.get('questions_safety', { type: 'json' }) || [];
    const violationQuestions = await env.SAFETY_CONTENT.get('questions_violation', { type: 'json' }) || [];
    
    let questionFound = false;
    
    // 在安全题库中查找
    const safetyIndex = safetyQuestions.findIndex(q => q.id === questionId);
    if (safetyIndex !== -1) {
      questionFound = true;
      safetyQuestions.splice(safetyIndex, 1);
      await env.SAFETY_CONTENT.put('questions_safety', JSON.stringify(safetyQuestions));
    } else {
      // 在违规题库中查找
      const violationIndex = violationQuestions.findIndex(q => q.id === questionId);
      if (violationIndex !== -1) {
        questionFound = true;
        violationQuestions.splice(violationIndex, 1);
        await env.SAFETY_CONTENT.put('questions_violation', JSON.stringify(violationQuestions));
      }
    }
    
    if (!questionFound) {
      return new Response(JSON.stringify({
        success: false,
        message: '题目不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: '题目删除成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Delete question error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '删除题目失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
