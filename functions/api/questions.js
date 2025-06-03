/**
 * 题目API - 从KV存储随机抽取题目
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 获取查询参数
  const questionType = url.searchParams.get('type') || 'safety';
  const count = parseInt(url.searchParams.get('count') || '10');
  const random = url.searchParams.get('random') === 'true';
  const difficulty = url.searchParams.get('difficulty');

  try {
    // 从KV存储获取题库
    const questionBankKey = `questions_${questionType}`;
    let questionBank;
    
    try {
      questionBank = await env.SAFETY_CONTENT.get(questionBankKey, { type: 'json' });
    } catch (error) {
      console.log('KV存储访问失败，使用模拟数据:', error.message);
      // 如果KV存储不可用，返回模拟数据
      questionBank = getMockQuestions(questionType);
    }

    if (!questionBank || !Array.isArray(questionBank)) {
      // 如果KV中没有数据，使用模拟数据
      questionBank = getMockQuestions(questionType);
    }

    // 过滤和处理题目
    let questions = questionBank;

    if (difficulty) {
      questions = questions.filter(q => q.difficulty === parseInt(difficulty));
    }

    if (random) {
      questions = shuffleArray(questions);
    }

    const selectedQuestions = questions.slice(0, count);

    // 移除敏感信息（如正确答案和解析）
    const publicQuestions = selectedQuestions.map(q => ({
      id: q.id,
      type: q.type,
      difficulty: q.difficulty,
      category: q.category,
      question: q.question,
      options: q.options,
      tags: q.tags
    }));

    return new Response(JSON.stringify({
      success: true,
      questions: publicQuestions,
      total: questions.length,
      returned: selectedQuestions.length,
      source: questionBank === getMockQuestions(questionType) ? 'mock' : 'kv'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5分钟缓存
      }
    });

  } catch (error) {
    console.error('Questions API Error:', error);
    
    // 错误时返回模拟数据
    const mockQuestions = getMockQuestions(questionType);
    const selectedQuestions = random ? shuffleArray([...mockQuestions]).slice(0, count) : mockQuestions.slice(0, count);
    
    const publicQuestions = selectedQuestions.map(q => ({
      id: q.id,
      type: q.type,
      difficulty: q.difficulty,
      category: q.category,
      question: q.question,
      options: q.options,
      tags: q.tags
    }));

    return new Response(JSON.stringify({
      success: true,
      questions: publicQuestions,
      total: mockQuestions.length,
      returned: selectedQuestions.length,
      source: 'mock',
      error: 'KV storage unavailable, using mock data'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      }
    });
  }
}

// 工具函数：随机打乱数组
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 模拟数据函数
function getMockQuestions(type) {
  const safetyQuestions = [
    {
      id: 1,
      type: 'single',
      difficulty: 2,
      category: 'operation_safety',
      question: '在进行高空作业时，以下哪项安全措施是必须的？',
      options: [
        '佩戴安全帽',
        '系好安全带',
        '检查作业环境',
        '以上都是'
      ],
      correctAnswer: 3,
      explanation: '高空作业必须同时采取佩戴安全帽、系好安全带、检查作业环境等所有安全措施，确保作业安全。'
    },
    {
      id: 2,
      type: 'multiple',
      difficulty: 3,
      category: 'equipment_safety',
      question: '使用电动工具时，需要检查哪些安全项目？',
      options: [
        '电源线是否完好',
        '接地线是否连接',
        '开关是否正常',
        '工具外壳是否破损'
      ],
      correctAnswer: [0, 1, 2, 3],
      explanation: '使用电动工具前必须全面检查电源线、接地线、开关和外壳等所有安全项目。'
    },
    {
      id: 3,
      type: 'boolean',
      difficulty: 1,
      category: 'basic_safety',
      question: '发现安全隐患时，应该立即报告给安全管理人员。',
      options: ['正确', '错误'],
      correctAnswer: 0,
      explanation: '发现安全隐患时必须立即报告，这是每个员工的安全责任。'
    },
    {
      id: 4,
      type: 'single',
      difficulty: 2,
      category: 'fire_safety',
      question: '发生火灾时，正确的逃生方法是？',
      options: [
        '乘坐电梯快速逃离',
        '用湿毛巾捂住口鼻，低姿势逃生',
        '打开所有门窗通风',
        '躲在房间内等待救援'
      ],
      correctAnswer: 1,
      explanation: '火灾逃生时应用湿毛巾捂住口鼻，采用低姿势逃生，避免吸入有毒烟雾。'
    },
    {
      id: 5,
      type: 'multiple',
      difficulty: 2,
      category: 'chemical_safety',
      question: '处理化学品时需要佩戴哪些防护用品？',
      options: [
        '防护手套',
        '防护眼镜',
        '防护服',
        '防毒面具'
      ],
      correctAnswer: [0, 1, 2, 3],
      explanation: '处理化学品时必须佩戴全套防护用品，包括手套、眼镜、防护服和防毒面具。'
    },
    {
      id: 6,
      type: 'single',
      difficulty: 1,
      category: 'basic_safety',
      question: '工作场所的安全标识主要用什么颜色表示禁止？',
      options: ['红色', '黄色', '蓝色', '绿色'],
      correctAnswer: 0,
      explanation: '红色是国际通用的禁止标识颜色，用于表示危险和禁止行为。'
    },
    {
      id: 7,
      type: 'boolean',
      difficulty: 1,
      category: 'equipment_safety',
      question: '使用机械设备前必须检查安全装置是否完好。',
      options: ['正确', '错误'],
      correctAnswer: 0,
      explanation: '使用任何机械设备前都必须检查安全装置，确保设备处于安全状态。'
    },
    {
      id: 8,
      type: 'single',
      difficulty: 3,
      category: 'emergency_response',
      question: '发生触电事故时，首先应该？',
      options: [
        '立即用手拉开触电者',
        '先切断电源再施救',
        '用水冲洗触电部位',
        '立即进行人工呼吸'
      ],
      correctAnswer: 1,
      explanation: '发生触电事故时，必须先切断电源，确保施救者安全，再进行救援。'
    },
    {
      id: 9,
      type: 'multiple',
      difficulty: 2,
      category: 'workplace_safety',
      question: '保持工作场所整洁的措施包括？',
      options: [
        '及时清理废料',
        '工具用后归位',
        '保持通道畅通',
        '定期清洁设备'
      ],
      correctAnswer: [0, 1, 2, 3],
      explanation: '工作场所整洁需要全面的管理，包括清理废料、工具归位、保持通道畅通和定期清洁。'
    },
    {
      id: 10,
      type: 'single',
      difficulty: 2,
      category: 'safety_management',
      question: '安全生产的方针是什么？',
      options: [
        '安全第一，预防为主',
        '安全第一，预防为主，综合治理',
        '预防为主，综合治理',
        '安全生产，人人有责'
      ],
      correctAnswer: 1,
      explanation: '我国安全生产方针是"安全第一，预防为主，综合治理"。'
    }
  ];

  const violationQuestions = [
    {
      id: 11,
      type: 'single',
      difficulty: 2,
      category: 'violation_identification',
      question: '以下哪种行为属于违规操作？',
      options: [
        '佩戴安全帽进入工地',
        '未经许可进入危险区域',
        '按规定使用防护设备',
        '遵守操作规程'
      ],
      correctAnswer: 1,
      explanation: '未经许可进入危险区域是典型的违规操作，可能导致严重安全事故。'
    },
    {
      id: 12,
      type: 'multiple',
      difficulty: 3,
      category: 'violation_types',
      question: '常见的违规操作包括哪些？',
      options: [
        '不佩戴防护用品',
        '违章指挥',
        '违章作业',
        '违反劳动纪律'
      ],
      correctAnswer: [0, 1, 2, 3],
      explanation: '违规操作包括不佩戴防护用品、违章指挥、违章作业和违反劳动纪律等多种形式。'
    }
  ];

  return type === 'safety' ? safetyQuestions : violationQuestions;
}
