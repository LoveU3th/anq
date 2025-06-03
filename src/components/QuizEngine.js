/**
 * 答题引擎
 * 负责题目管理、答案验证、计分等核心逻辑
 */

import { Logger } from '../utils/logger.js';
import { dataManager } from '../modules/data-manager.js';

export class QuizEngine {
  constructor(quizType = 'safety') {
    this.logger = new Logger('QuizEngine');
    this.quizType = quizType;
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.tempAnswers = []; // 临时答案存储，用于题目间导航时保存未提交的答案
    this.startTime = null;
    this.endTime = null;
    this.totalScore = 0;
  }

  /**
   * 初始化测试
   */
  async initQuiz() {
    try {
      this.logger.info(`初始化${this.quizType}测试`);

      // 加载题目
      await this.loadQuestions();

      // 重置状态
      this.resetQuizState();

      this.logger.info(`测试初始化完成，共${this.questions.length}道题目`);

    } catch (error) {
      this.logger.error('测试初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载题目
   */
  async loadQuestions() {
    try {
      // 使用数据管理器获取题目
      this.questions = await dataManager.getRandomQuestions(this.quizType, {
        count: 10,
        random: true,
        useCache: true
      });

      this.logger.info(`从数据管理器加载了${this.questions.length}道题目`);
    } catch (error) {
      this.logger.warn('数据管理器加载失败，使用模拟数据:', error.message);

      // 如果数据管理器失败，使用模拟数据作为后备
      this.questions = this.getMockQuestions(this.quizType);

      // 随机打乱题目顺序
      this.shuffleQuestions();

      // 只取前10道题
      this.questions = this.questions.slice(0, 10);
    }
  }

  /**
   * 获取模拟题目数据
   */
  getMockQuestions(type) {
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
        question: '发生火灾时，正确的逃生方向是？',
        options: [
          '向上逃生',
          '向下逃生',
          '就近逃生',
          '等待救援'
        ],
        correctAnswer: 1,
        explanation: '火灾时应向下逃生，因为烟雾和热气会向上蔓延，向下逃生更安全。'
      },
      {
        id: 5,
        type: 'single',
        difficulty: 3,
        category: 'chemical_safety',
        question: '处理化学品时，最重要的个人防护设备是？',
        options: [
          '防护眼镜',
          '防护手套',
          '防护服',
          '根据化学品性质选择'
        ],
        correctAnswer: 3,
        explanation: '不同化学品需要不同的防护设备，应根据化学品的具体性质选择合适的防护措施。'
      },
      {
        id: 6,
        type: 'multiple',
        difficulty: 2,
        category: 'workplace_safety',
        question: '保持工作场所安全需要做到哪些？',
        options: [
          '保持通道畅通',
          '及时清理杂物',
          '正确摆放工具',
          '定期检查设备'
        ],
        correctAnswer: [0, 1, 2, 3],
        explanation: '工作场所安全需要保持通道畅通、及时清理杂物、正确摆放工具和定期检查设备。'
      },
      {
        id: 7,
        type: 'boolean',
        difficulty: 1,
        category: 'basic_safety',
        question: '安全培训只需要新员工参加，老员工可以不参加。',
        options: ['正确', '错误'],
        correctAnswer: 1,
        explanation: '安全培训是持续性的，所有员工都需要定期参加，以更新安全知识和技能。'
      },
      {
        id: 8,
        type: 'single',
        difficulty: 2,
        category: 'emergency_response',
        question: '发生工伤事故后，首先应该做什么？',
        options: [
          '立即报告领导',
          '保护现场',
          '救治伤员',
          '调查原因'
        ],
        correctAnswer: 2,
        explanation: '发生工伤事故后，首要任务是救治伤员，保护生命安全是第一位的。'
      },
      {
        id: 9,
        type: 'multiple',
        difficulty: 3,
        category: 'risk_assessment',
        question: '进行风险评估时需要考虑哪些因素？',
        options: [
          '危险源识别',
          '风险发生概率',
          '风险后果严重程度',
          '现有控制措施'
        ],
        correctAnswer: [0, 1, 2, 3],
        explanation: '风险评估需要全面考虑危险源、发生概率、后果严重程度和现有控制措施等所有因素。'
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
      },
      // 可以继续添加更多违规识别题目...
    ];

    return type === 'safety' ? safetyQuestions : violationQuestions;
  }

  /**
   * 随机打乱题目顺序
   */
  shuffleQuestions() {
    for (let i = this.questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
    }
  }

  /**
   * 重置测试状态
   */
  resetQuizState() {
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.tempAnswers = [];
    this.startTime = Date.now();
    this.endTime = null;
    this.totalScore = 0;
  }

  /**
   * 获取当前题目
   */
  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex];
  }

  /**
   * 获取当前题目索引
   */
  getCurrentQuestionIndex() {
    return this.currentQuestionIndex;
  }

  /**
   * 获取题目总数
   */
  getTotalQuestions() {
    return this.questions.length;
  }

  /**
   * 提交答案
   */
  async submitAnswer(selectedAnswers) {
    const question = this.getCurrentQuestion();
    if (!question) {
      throw new Error('当前没有有效题目');
    }

    try {
      // 使用API验证答案
      const isCorrect = await this.validateAnswerViaAPI(question.id, selectedAnswers);

      // 计算得分
      const score = this.calculateScore(question, isCorrect);

      // 记录用户答案
      const answerRecord = {
        questionId: question.id,
        selectedAnswers: selectedAnswers,
        isCorrect: isCorrect,
        score: score,
        timestamp: Date.now()
      };

      this.userAnswers[this.currentQuestionIndex] = answerRecord;
      this.totalScore += score;

      this.logger.info(`题目${this.currentQuestionIndex + 1}答题结果:`, answerRecord);

      return {
        isCorrect: isCorrect,
        score: score,
        question: question,
        selectedAnswers: selectedAnswers
      };
    } catch (error) {
      this.logger.error('答案验证失败:', error);
      // 如果API失败，使用本地验证作为后备
      const isCorrect = this.validateAnswer(question, selectedAnswers);
      const score = this.calculateScore(question, isCorrect);

      const answerRecord = {
        questionId: question.id,
        selectedAnswers: selectedAnswers,
        isCorrect: isCorrect,
        score: score,
        timestamp: Date.now()
      };

      this.userAnswers[this.currentQuestionIndex] = answerRecord;
      this.totalScore += score;

      return {
        isCorrect: isCorrect,
        score: score,
        question: question,
        selectedAnswers: selectedAnswers
      };
    }
  }

  /**
   * 通过API验证答案
   */
  async validateAnswerViaAPI(questionId, selectedAnswers) {
    try {
      // 使用数据管理器验证答案
      const result = await dataManager.validateAnswer(questionId, selectedAnswers, this.quizType);
      return result.isCorrect;
    } catch (error) {
      this.logger.warn('数据管理器验证失败，使用本地验证:', error.message);
      throw error;
    }
  }

  /**
   * 验证答案（本地后备方法）
   */
  validateAnswer(question, selectedAnswers) {
    const correctAnswer = question.correctAnswer;

    if (Array.isArray(correctAnswer)) {
      // 多选题：需要选中的答案完全匹配
      if (selectedAnswers.length !== correctAnswer.length) {
        return false;
      }
      return correctAnswer.every(answer => selectedAnswers.includes(answer));
    } else {
      // 单选题和判断题：只需要一个正确答案
      return selectedAnswers.length === 1 && selectedAnswers[0] === correctAnswer;
    }
  }

  /**
   * 计算得分
   */
  calculateScore(question, isCorrect) {
    if (!isCorrect) return 0;

    // 每题固定10分，确保总分100分
    const totalQuestions = this.questions.length;
    const scorePerQuestion = Math.round(100 / totalQuestions);

    return scorePerQuestion;
  }

  /**
   * 上一题
   */
  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      return true;
    }
    return false;
  }

  /**
   * 下一题
   */
  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      return true;
    }
    return false;
  }

  /**
   * 跳转到指定题目
   */
  goToQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.currentQuestionIndex = index;
      return true;
    }
    return false;
  }

  /**
   * 保存当前题目的临时答案
   */
  saveTempAnswer(selectedAnswers) {
    this.tempAnswers[this.currentQuestionIndex] = selectedAnswers;
    this.logger.info(`保存题目${this.currentQuestionIndex + 1}的临时答案:`, selectedAnswers);
  }

  /**
   * 获取当前题目的临时答案
   */
  getTempAnswer() {
    return this.tempAnswers[this.currentQuestionIndex] || [];
  }

  /**
   * 检查当前题目是否已提交
   */
  isCurrentQuestionSubmitted() {
    return this.userAnswers[this.currentQuestionIndex] !== undefined;
  }

  /**
   * 获取测试统计信息
   */
  getQuizStats() {
    const answeredCount = this.userAnswers.filter(answer => answer).length;
    const correctCount = this.userAnswers.filter(answer => answer && answer.isCorrect).length;

    return {
      totalQuestions: this.questions.length,
      answeredCount: answeredCount,
      correctCount: correctCount,
      currentScore: this.totalScore,
      currentQuestionIndex: this.currentQuestionIndex
    };
  }

  /**
   * 获取最终测试结果
   */
  getQuizResult() {
    this.endTime = Date.now();

    const stats = this.getQuizStats();
    const totalTime = this.endTime - this.startTime;
    const accuracyRate = Math.round((stats.correctCount / stats.totalQuestions) * 100);

    const result = {
      totalScore: this.totalScore,
      maxScore: this.calculateMaxScore(),
      correctCount: stats.correctCount,
      wrongCount: stats.totalQuestions - stats.correctCount,
      totalQuestions: stats.totalQuestions,
      accuracyRate: accuracyRate,
      totalTime: totalTime,
      startTime: this.startTime,
      endTime: this.endTime,
      userAnswers: this.userAnswers,
      questions: this.questions
    };

    this.logger.info('测试完成，最终结果:', result);
    return result;
  }

  /**
   * 计算最大可能得分
   */
  calculateMaxScore() {
    return this.questions.reduce((total, question) => {
      return total + this.calculateScore(question, true);
    }, 0);
  }

  /**
   * 获取所有题目
   */
  getAllQuestions() {
    return this.questions;
  }

  /**
   * 获取用户答案
   */
  getUserAnswers() {
    return this.userAnswers;
  }

  /**
   * 获取指定题目的用户答案
   */
  getUserAnswer(questionIndex) {
    return this.userAnswers[questionIndex];
  }

  /**
   * 检查是否已完成所有题目
   */
  isQuizComplete() {
    return this.userAnswers.filter(answer => answer).length === this.questions.length;
  }

  /**
   * 获取答题进度百分比
   */
  getProgressPercentage() {
    const answeredCount = this.userAnswers.filter(answer => answer).length;
    return Math.round((answeredCount / this.questions.length) * 100);
  }

  /**
   * 获取题目分类统计
   */
  getCategoryStats() {
    const categoryStats = {};

    this.questions.forEach((question, index) => {
      const category = question.category;
      const userAnswer = this.userAnswers[index];

      if (!categoryStats[category]) {
        categoryStats[category] = {
          total: 0,
          correct: 0,
          answered: 0
        };
      }

      categoryStats[category].total++;

      if (userAnswer) {
        categoryStats[category].answered++;
        if (userAnswer.isCorrect) {
          categoryStats[category].correct++;
        }
      }
    });

    return categoryStats;
  }

  /**
   * 获取难度统计
   */
  getDifficultyStats() {
    const difficultyStats = {};

    this.questions.forEach((question, index) => {
      const difficulty = question.difficulty;
      const userAnswer = this.userAnswers[index];

      if (!difficultyStats[difficulty]) {
        difficultyStats[difficulty] = {
          total: 0,
          correct: 0,
          answered: 0
        };
      }

      difficultyStats[difficulty].total++;

      if (userAnswer) {
        difficultyStats[difficulty].answered++;
        if (userAnswer.isCorrect) {
          difficultyStats[difficulty].correct++;
        }
      }
    });

    return difficultyStats;
  }

  /**
   * 重置到指定题目
   */
  resetToQuestion(questionIndex) {
    if (questionIndex >= 0 && questionIndex < this.questions.length) {
      this.currentQuestionIndex = questionIndex;
      // 清除该题目之后的所有答案
      this.userAnswers = this.userAnswers.slice(0, questionIndex);
      // 重新计算总分
      this.recalculateScore();
      return true;
    }
    return false;
  }

  /**
   * 重新计算总分
   */
  recalculateScore() {
    this.totalScore = this.userAnswers.reduce((total, answer) => {
      return total + (answer ? answer.score : 0);
    }, 0);
  }

  /**
   * 导出测试数据
   */
  exportQuizData() {
    return {
      quizType: this.quizType,
      questions: this.questions,
      userAnswers: this.userAnswers,
      stats: this.getQuizStats(),
      result: this.endTime ? this.getQuizResult() : null,
      timestamp: Date.now()
    };
  }

  /**
   * 获取错题列表
   */
  getWrongAnswers() {
    return this.userAnswers
      .map((answer, index) => ({
        questionIndex: index,
        question: this.questions[index],
        userAnswer: answer
      }))
      .filter(item => item.userAnswer && !item.userAnswer.isCorrect);
  }

  /**
   * 获取正确答题列表
   */
  getCorrectAnswers() {
    return this.userAnswers
      .map((answer, index) => ({
        questionIndex: index,
        question: this.questions[index],
        userAnswer: answer
      }))
      .filter(item => item.userAnswer && item.userAnswer.isCorrect);
  }
}
