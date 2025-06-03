/**
 * 管理员认证API
 * 处理管理员登录、验证和会话管理
 */

// 简单的管理员凭据（实际项目中应该使用更安全的方式）
const ADMIN_CREDENTIALS = {
  username: 'admin',
  // 这里应该是哈希后的密码，为了演示使用明文
  password: 'admin123'
};

/**
 * 处理管理员登录
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, password } = await request.json();
    
    // 验证凭据
    if (username === ADMIN_CREDENTIALS.username && 
        password === ADMIN_CREDENTIALS.password) {
      
      // 生成简单的会话token（实际项目中应该使用JWT）
      const token = generateSessionToken();
      
      // 存储会话信息到KV
      await env.SAFETY_CONTENT.put(`admin_session:${token}`, JSON.stringify({
        username,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30分钟过期
      }), {
        expirationTtl: 30 * 60 // 30分钟
      });
      
      return new Response(JSON.stringify({
        success: true,
        token,
        message: '登录成功'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=1800`
        }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: '用户名或密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '登录失败，请重试'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 验证管理员会话
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        message: '未提供认证token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const token = authHeader.slice(7);
    const sessionData = await env.SAFETY_CONTENT.get(`admin_session:${token}`, { type: 'json' });
    
    if (!sessionData) {
      return new Response(JSON.stringify({
        success: false,
        message: '会话已过期或无效'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 检查会话是否过期
    if (new Date() > new Date(sessionData.expiresAt)) {
      // 删除过期会话
      await env.SAFETY_CONTENT.delete(`admin_session:${token}`);
      
      return new Response(JSON.stringify({
        success: false,
        message: '会话已过期'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      user: {
        username: sessionData.username,
        loginTime: sessionData.loginTime
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '验证失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 管理员登出
 */
export async function onRequestDelete(context) {
  const { request, env } = context;
  
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      
      // 删除会话
      await env.SAFETY_CONTENT.delete(`admin_session:${token}`);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: '登出成功'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'admin_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
      }
    });
    
  } catch (error) {
    console.error('Admin logout error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '登出失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 生成会话token
 */
function generateSessionToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * 验证管理员权限的中间件函数
 */
export async function verifyAdminAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, message: '未提供认证token' };
  }
  
  const token = authHeader.slice(7);
  const sessionData = await env.SAFETY_CONTENT.get(`admin_session:${token}`, { type: 'json' });
  
  if (!sessionData) {
    return { success: false, message: '会话无效' };
  }
  
  if (new Date() > new Date(sessionData.expiresAt)) {
    await env.SAFETY_CONTENT.delete(`admin_session:${token}`);
    return { success: false, message: '会话已过期' };
  }
  
  return { 
    success: true, 
    user: {
      username: sessionData.username,
      loginTime: sessionData.loginTime
    }
  };
}
