/**
 * 答题页面组件
 * 负责答题系统的主要界面和交互逻辑
 */

import { Logger } from '../utils/logger.js';
import { QuizEngine } from './QuizEngine.js';

export default class QuizPage {
  constructor() {
    this.logger = new Logger('QuizPage');
    this.quizEngine = null;
    this.currentQuizType = null;
    this.isQuizStarted = false;
  }

  /**
   * 渲染答题页面
   */
  static async render(data = {}) {
    const quizType = data.type || 'safety';
    const pageTitle = quizType === 'safety' ? '安全意识测试' : '违规识别测试';
    const pageDescription = quizType === 'safety'
      ? '通过测试检验您的安全知识掌握程度，提升安全意识'
      : '识别违规操作场景，增强安全风险防范能力';

    return `
      <!-- Quiz Page Container -->
      <div class="quiz-page">
        <!-- Header -->
        <header class="app-header">
          <div class="container">
            <div class="header-content">
              <div class="logo">
                <span class="logo-text">🛡️ 安全学习平台</span>
              </div>
              <nav class="main-nav">
                <a href="/" class="nav-link">首页</a>
                <a href="/video/safety" class="nav-link">安全操作</a>
                <a href="/video/violation" class="nav-link">违规案例</a>
                <a href="/quiz/safety" class="nav-link ${quizType === 'safety' ? 'active' : ''}">安全测试</a>
                <a href="/quiz/violation" class="nav-link ${quizType === 'violation' ? 'active' : ''}">违规识别</a>
              </nav>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="quiz-main">
          <!-- Quiz Header -->
          <section class="quiz-header">
            <div class="container">
              <div class="quiz-header-content">
                <h1 class="quiz-title">${pageTitle}</h1>
                <p class="quiz-description">${pageDescription}</p>
                <div class="quiz-stats" id="quiz-stats" style="display: none;">
                  <div class="stat-item">
                    <span class="stat-label">题目进度</span>
                    <span class="stat-value" id="progress-text">0/10</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">当前得分</span>
                    <span class="stat-value" id="score-text">0分</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">用时</span>
                    <span class="stat-value" id="timer-text">00:00</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Quiz Content -->
          <section class="quiz-content">
            <div class="container">
              <!-- Quiz Start Screen -->
              <div class="quiz-start-screen" id="quiz-start-screen">
                <div class="start-card">
                  <div class="start-icon">📝</div>
                  <h2>准备开始测试</h2>
                  <div class="quiz-info">
                    <div class="info-item">
                      <span class="info-icon">📊</span>
                      <span class="info-text">共10道题目</span>
                    </div>
                    <div class="info-item">
                      <span class="info-icon">⏱️</span>
                      <span class="info-text">建议用时15分钟</span>
                    </div>
                    <div class="info-item">
                      <span class="info-icon">🎯</span>
                      <span class="info-text">80分及格</span>
                    </div>
                  </div>
                  <div class="quiz-rules">
                    <h3>测试说明</h3>
                    <ul>
                      <li>题目包含单选题、多选题和判断题</li>
                      <li>每题只有一次答题机会</li>
                      <li>答题后会立即显示正确答案和解析</li>
                      <li>完成所有题目后可查看详细分析</li>
                    </ul>
                  </div>
                  <button class="btn btn-primary btn-large" id="start-quiz-btn">
                    开始测试
                  </button>
                </div>
              </div>

              <!-- Quiz Question Screen -->
              <div class="quiz-question-screen" id="quiz-question-screen" style="display: none;">
                <!-- Progress Bar -->
                <div class="progress-container">
                  <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill"></div>
                  </div>
                  <span class="progress-label" id="progress-label">第1题 / 共10题</span>
                </div>

                <!-- Question Container -->
                <div class="question-container" id="question-container">
                  <!-- 题目内容将在这里动态生成 -->
                </div>

                <!-- Navigation Buttons -->
                <div class="quiz-navigation">
                  <button class="btn btn-secondary" id="prev-btn" disabled>
                    上一题
                  </button>
                  <div class="nav-center-buttons">
                    <button class="btn btn-primary" id="submit-answer-btn" disabled>
                      提交答案
                    </button>
                  </div>
                  <button class="btn btn-secondary" id="next-btn" disabled>
                    下一题
                  </button>
                </div>
              </div>

              <!-- Quiz Result Screen -->
              <div class="quiz-result-screen" id="quiz-result-screen" style="display: none;">
                <div class="result-card">
                  <div class="result-header">
                    <div class="result-icon" id="result-icon">🎉</div>
                    <h2 class="result-title" id="result-title">测试完成！</h2>
                    <div class="result-score">
                      <span class="score-label">您的得分</span>
                      <span class="score-value" id="final-score">0</span>
                      <span class="score-total">/ 100</span>
                    </div>
                  </div>
                  
                  <div class="result-details">
                    <div class="detail-grid">
                      <div class="detail-item">
                        <span class="detail-label">正确题数</span>
                        <span class="detail-value" id="correct-count">0</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">错误题数</span>
                        <span class="detail-value" id="wrong-count">0</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">用时</span>
                        <span class="detail-value" id="total-time">00:00</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">正确率</span>
                        <span class="detail-value" id="accuracy-rate">0%</span>
                      </div>
                    </div>
                  </div>

                  <div class="result-analysis" id="result-analysis">
                    <!-- 结果分析内容 -->
                  </div>

                  <div class="result-actions">
                    <button class="btn btn-secondary" id="review-answers-btn">
                      查看答案解析
                    </button>
                    <button class="btn btn-primary" id="retake-quiz-btn">
                      重新测试
                    </button>
                    <a href="/" class="btn btn-outline">
                      返回首页
                    </a>
                  </div>
                </div>
              </div>

              <!-- Answer Review Screen -->
              <div class="quiz-review-screen" id="quiz-review-screen" style="display: none;">
                <div class="review-header">
                  <h2>答案解析</h2>
                  <button class="btn btn-secondary" id="back-to-result-btn">
                    返回结果
                  </button>
                </div>
                <div class="review-content" id="review-content">
                  <!-- 答案解析内容 -->
                </div>
              </div>
            </div>
          </section>
        </main>

        <!-- Loading Overlay -->
        <div class="loading-overlay" id="loading-overlay" style="display: none;">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>正在加载题目...</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 组件挂载后的初始化
   */
  static async mounted() {
    const instance = new QuizPage();
    await instance.init();
  }

  /**
   * 初始化答题页面
   */
  async init() {
    try {
      this.logger.info('初始化答题页面');

      // 获取当前测试类型
      this.currentQuizType = this.getQuizTypeFromUrl();

      // 初始化答题引擎
      this.quizEngine = new QuizEngine(this.currentQuizType);

      // 绑定事件监听器
      this.bindEventListeners();

      this.logger.info('答题页面初始化完成');
    } catch (error) {
      this.logger.error('答题页面初始化失败:', error);
      this.showError('页面初始化失败，请刷新重试');
    }
  }

  /**
   * 从URL获取测试类型
   */
  getQuizTypeFromUrl() {
    const path = window.location.pathname;
    if (path.includes('/quiz/violation')) {
      return 'violation';
    }
    return 'safety';
  }

  /**
   * 绑定事件监听器
   */
  bindEventListeners() {
    // 开始测试按钮
    const startBtn = document.getElementById('start-quiz-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startQuiz());
    }

    // 导航按钮
    const prevBtn = document.getElementById('prev-btn');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousQuestion());
    }
    if (submitAnswerBtn) {
      submitAnswerBtn.addEventListener('click', () => this.submitCurrentAnswer());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }

    // 结果页面按钮
    const reviewBtn = document.getElementById('review-answers-btn');
    const retakeBtn = document.getElementById('retake-quiz-btn');
    const backToResultBtn = document.getElementById('back-to-result-btn');

    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => this.showAnswerReview());
    }
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => this.retakeQuiz());
    }
    if (backToResultBtn) {
      backToResultBtn.addEventListener('click', () => this.backToResult());
    }
  }

  /**
   * 开始测试
   */
  async startQuiz() {
    try {
      this.showLoading('正在加载题目...');

      // 初始化测试
      await this.quizEngine.initQuiz();

      // 切换到答题界面
      this.showQuestionScreen();

      // 显示第一题
      this.showCurrentQuestion();

      // 开始计时
      this.startTimer();

      this.isQuizStarted = true;
      this.hideLoading();

    } catch (error) {
      this.logger.error('开始测试失败:', error);
      this.hideLoading();
      this.showError('加载题目失败，请重试');
    }
  }

  /**
   * 显示答题界面
   */
  showQuestionScreen() {
    document.getElementById('quiz-start-screen').style.display = 'none';
    document.getElementById('quiz-question-screen').style.display = 'block';
    document.getElementById('quiz-stats').style.display = 'flex';
  }

  /**
   * 显示当前题目
   */
  showCurrentQuestion() {
    const question = this.quizEngine.getCurrentQuestion();
    const questionContainer = document.getElementById('question-container');

    if (!question) {
      this.logger.error('无法获取当前题目');
      return;
    }

    // 渲染题目
    questionContainer.innerHTML = this.renderQuestion(question);

    // 更新进度
    this.updateProgress();

    // 更新导航按钮状态
    this.updateNavigationButtons();

    // 绑定选项点击事件
    this.bindOptionEvents();

    // 恢复答案状态
    this.restoreAnswerState();
  }

  /**
   * 渲染题目
   */
  renderQuestion(question) {
    const questionNumber = this.quizEngine.getCurrentQuestionIndex() + 1;
    const typeText = this.getQuestionTypeText(question.type);

    return `
      <div class="question-card">
        <div class="question-header">
          <span class="question-number">第${questionNumber}题</span>
          <span class="question-type">${typeText}</span>
          <span class="question-difficulty">难度: ${'★'.repeat(question.difficulty)}</span>
        </div>

        <div class="question-content">
          <h3 class="question-title">${question.question}</h3>
          ${question.image ? `<img src="${question.image}" alt="题目图片" class="question-image">` : ''}
        </div>

        <div class="question-options">
          ${this.renderOptions(question)}
        </div>
      </div>
    `;
  }

  /**
   * 渲染选项
   */
  renderOptions(question) {
    const inputType = question.type === 'multiple' ? 'checkbox' : 'radio';
    const inputName = `question_${question.id}`;

    return question.options.map((option, index) => `
      <div class="option-item" data-index="${index}">
        <input
          type="${inputType}"
          id="${inputName}_${index}"
          name="${inputName}"
          value="${index}"
          class="option-input"
        >
        <label for="${inputName}_${index}" class="option-label">
          <span class="option-marker">${String.fromCharCode(65 + index)}</span>
          <span class="option-text">${option}</span>
        </label>
      </div>
    `).join('');
  }

  /**
   * 获取题目类型文本
   */
  getQuestionTypeText(type) {
    const typeMap = {
      'single': '单选题',
      'multiple': '多选题',
      'boolean': '判断题'
    };
    return typeMap[type] || '未知题型';
  }

  /**
   * 绑定选项点击事件
   */
  bindOptionEvents() {
    const question = this.quizEngine.getCurrentQuestion();

    // 为每个选项绑定点击事件
    const options = document.querySelectorAll('.option-item');
    options.forEach(option => {
      const input = option.querySelector('.option-input');

      // 为整个选项区域绑定点击事件
      option.addEventListener('click', (e) => {
        // 如果已经禁用，不处理点击
        if (option.classList.contains('disabled')) return;

        // 阻止事件冒泡
        e.preventDefault();
        e.stopPropagation();

        if (question.type === 'multiple') {
          // 多选题：切换选中状态
          input.checked = !input.checked;
        } else {
          // 单选题和判断题：清除其他选项，选中当前选项
          const allInputs = document.querySelectorAll(`input[name="${input.name}"]`);
          allInputs.forEach(inp => {
            inp.checked = false;
            inp.parentElement.classList.remove('selected');
          });
          input.checked = true;
        }

        // 更新选项样式
        this.updateOptionStyles();

        // 检查是否可以提交答案
        this.checkCanSubmit();
      });
    });
  }

  /**
   * 更新选项样式
   */
  updateOptionStyles() {
    const options = document.querySelectorAll('.option-item');

    options.forEach(option => {
      const input = option.querySelector('.option-input');
      if (input.checked) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });
  }

  /**
   * 恢复答案状态
   */
  restoreAnswerState() {
    const isSubmitted = this.quizEngine.isCurrentQuestionSubmitted();

    if (isSubmitted) {
      // 如果题目已提交，恢复已提交的答案并禁用所有选项
      const userAnswer = this.quizEngine.userAnswers[this.quizEngine.getCurrentQuestionIndex()];
      if (userAnswer) {
        this.restoreSubmittedAnswer(userAnswer.selectedAnswers);
      }
    } else {
      // 如果题目未提交，恢复临时答案
      const tempAnswer = this.quizEngine.getTempAnswer();
      if (tempAnswer.length > 0) {
        this.restoreTempAnswer(tempAnswer);
      }
    }
  }

  /**
   * 恢复已提交的答案
   */
  restoreSubmittedAnswer(selectedAnswers) {
    selectedAnswers.forEach(value => {
      const input = document.querySelector(`.option-input[value="${value}"]`);
      if (input) {
        input.checked = true;
        input.disabled = true;
        input.parentElement.classList.add('selected', 'disabled');
      }
    });

    // 禁用提交按钮
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    if (submitAnswerBtn) {
      submitAnswerBtn.disabled = true;
      submitAnswerBtn.textContent = '已提交';
    }
  }

  /**
   * 恢复临时答案
   */
  restoreTempAnswer(selectedAnswers) {
    selectedAnswers.forEach(value => {
      const input = document.querySelector(`.option-input[value="${value}"]`);
      if (input) {
        input.checked = true;
        input.parentElement.classList.add('selected');
      }
    });

    // 更新选项样式和按钮状态
    this.updateOptionStyles();
    this.checkCanSubmit();
  }

  /**
   * 检查是否可以提交答案
   */
  checkCanSubmit() {
    const selectedInputs = document.querySelectorAll('.option-input:checked');
    const hasAnswer = selectedInputs.length > 0;

    const submitAnswerBtn = document.getElementById('submit-answer-btn');

    if (hasAnswer) {
      if (submitAnswerBtn) submitAnswerBtn.disabled = false;
      // 保存临时答案
      const selectedValues = Array.from(selectedInputs).map(input => parseInt(input.value));
      this.quizEngine.saveTempAnswer(selectedValues);
    } else {
      if (submitAnswerBtn) submitAnswerBtn.disabled = true;
      // 清除临时答案
      this.quizEngine.saveTempAnswer([]);
    }
  }

  /**
   * 提交当前题目答案
   */
  async submitCurrentAnswer() {
    const question = this.quizEngine.getCurrentQuestion();
    const selectedInputs = document.querySelectorAll('.option-input:checked');
    const selectedValues = Array.from(selectedInputs).map(input => parseInt(input.value));

    if (selectedValues.length === 0) {
      this.showError('请选择答案后再提交');
      return;
    }

    try {
      // 显示加载状态
      const submitAnswerBtn = document.getElementById('submit-answer-btn');
      if (submitAnswerBtn) {
        submitAnswerBtn.disabled = true;
        submitAnswerBtn.textContent = '提交中...';
      }

      // 提交答案到引擎
      const result = await this.quizEngine.submitAnswer(selectedValues);

      // 更新统计信息
      this.updateQuizStats();
    } catch (error) {
      this.logger.error('提交答案失败:', error);
      this.showError('提交失败，请重试');

      // 恢复按钮状态
      const submitAnswerBtn = document.getElementById('submit-answer-btn');
      if (submitAnswerBtn) {
        submitAnswerBtn.disabled = false;
        submitAnswerBtn.textContent = '提交答案';
      }
      return;
    }

    // 禁用所有选项，防止重复选择
    const options = document.querySelectorAll('.option-item');
    options.forEach(option => {
      option.classList.add('disabled');
      const input = option.querySelector('.option-input');
      input.disabled = true;
    });

    // 禁用提交按钮
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    if (submitAnswerBtn) {
      submitAnswerBtn.disabled = true;
      submitAnswerBtn.textContent = '已提交';
    }

    // 更新导航按钮状态
    this.updateNavigationButtons();

    // 自动跳转逻辑
    const currentIndex = this.quizEngine.getCurrentQuestionIndex();
    const totalQuestions = this.quizEngine.getTotalQuestions();

    if (currentIndex === totalQuestions - 1) {
      // 如果是最后一题，显示完成提示并自动完成测试
      this.showAutoActionMessage('正在完成测试...', 1200);
      setTimeout(() => {
        this.submitQuiz();
      }, 1200);
    } else {
      // 如果不是最后一题，显示跳转提示并自动跳转到下一题
      this.showAutoActionMessage('正在跳转到下一题...', 1200);
      setTimeout(() => {
        this.nextQuestion();
      }, 1200);
    }
  }





  /**
   * 更新进度显示
   */
  updateProgress() {
    const currentIndex = this.quizEngine.getCurrentQuestionIndex();
    const totalQuestions = this.quizEngine.getTotalQuestions();
    const progress = ((currentIndex + 1) / totalQuestions) * 100;

    // 更新进度条
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    // 更新进度文字
    const progressLabel = document.getElementById('progress-label');
    if (progressLabel) {
      progressLabel.textContent = `第${currentIndex + 1}题 / 共${totalQuestions}题`;
    }

    const progressText = document.getElementById('progress-text');
    if (progressText) {
      progressText.textContent = `${currentIndex + 1}/${totalQuestions}`;
    }
  }

  /**
   * 更新导航按钮状态
   */
  updateNavigationButtons() {
    const currentIndex = this.quizEngine.getCurrentQuestionIndex();
    const totalQuestions = this.quizEngine.getTotalQuestions();
    const isLastQuestion = currentIndex === totalQuestions - 1;
    const isSubmitted = this.quizEngine.isCurrentQuestionSubmitted();

    const prevBtn = document.getElementById('prev-btn');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    const nextBtn = document.getElementById('next-btn');

    // 上一题按钮
    if (prevBtn) {
      prevBtn.disabled = currentIndex === 0;
    }

    // 下一题按钮
    if (nextBtn) {
      nextBtn.disabled = isLastQuestion;
    }

    // 提交答案按钮状态
    if (submitAnswerBtn) {
      if (isSubmitted) {
        submitAnswerBtn.textContent = '已提交';
        submitAnswerBtn.disabled = true;
      } else {
        submitAnswerBtn.textContent = '提交答案';
        submitAnswerBtn.disabled = true; // 默认禁用，有答案时会启用
      }
    }
  }

  /**
   * 更新测试统计信息
   */
  updateQuizStats() {
    const stats = this.quizEngine.getQuizStats();

    const scoreText = document.getElementById('score-text');
    if (scoreText) {
      scoreText.textContent = `${stats.currentScore}分`;
    }
  }

  /**
   * 上一题
   */
  previousQuestion() {
    // 保存当前选择的答案作为临时答案
    const selectedInputs = document.querySelectorAll('.option-input:checked');
    if (selectedInputs.length > 0) {
      const selectedValues = Array.from(selectedInputs).map(input => parseInt(input.value));
      this.quizEngine.saveTempAnswer(selectedValues);
    }

    if (this.quizEngine.previousQuestion()) {
      this.showCurrentQuestion();
    }
  }

  /**
   * 下一题
   */
  nextQuestion() {
    // 保存当前选择的答案作为临时答案
    const selectedInputs = document.querySelectorAll('.option-input:checked');
    if (selectedInputs.length > 0) {
      const selectedValues = Array.from(selectedInputs).map(input => parseInt(input.value));
      this.quizEngine.saveTempAnswer(selectedValues);
    }

    if (this.quizEngine.nextQuestion()) {
      this.showCurrentQuestion();
    }
  }

  /**
   * 提交测试
   */
  async submitQuiz() {
    try {
      // 停止计时
      this.stopTimer();

      // 获取最终结果
      const result = this.quizEngine.getQuizResult();

      // 显示结果页面
      this.showResultScreen(result);

    } catch (error) {
      this.logger.error('提交测试失败:', error);
      this.showError('提交失败，请重试');
    }
  }

  /**
   * 显示结果页面
   */
  showResultScreen(result) {
    // 隐藏答题界面
    document.getElementById('quiz-question-screen').style.display = 'none';
    document.getElementById('quiz-stats').style.display = 'none';

    // 显示结果界面
    document.getElementById('quiz-result-screen').style.display = 'block';

    // 更新结果数据
    this.updateResultDisplay(result);
  }

  /**
   * 更新结果显示
   */
  updateResultDisplay(result) {
    // 更新得分
    const finalScore = document.getElementById('final-score');
    if (finalScore) {
      finalScore.textContent = result.totalScore;
    }

    // 更新详细统计
    const correctCount = document.getElementById('correct-count');
    const wrongCount = document.getElementById('wrong-count');
    const totalTime = document.getElementById('total-time');
    const accuracyRate = document.getElementById('accuracy-rate');

    if (correctCount) correctCount.textContent = result.correctCount;
    if (wrongCount) wrongCount.textContent = result.wrongCount;
    if (totalTime) totalTime.textContent = this.formatTime(result.totalTime);
    if (accuracyRate) accuracyRate.textContent = `${result.accuracyRate}%`;

    // 更新结果图标和标题
    this.updateResultHeader(result);

    // 更新结果分析
    this.updateResultAnalysis(result);
  }

  /**
   * 更新结果头部
   */
  updateResultHeader(result) {
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');

    if (result.totalScore >= 90) {
      if (resultIcon) resultIcon.textContent = '🏆';
      if (resultTitle) resultTitle.textContent = '及格！优秀！';
    } else {
      if (resultIcon) resultIcon.textContent = '📚';
      if (resultTitle) resultTitle.textContent = '不及格，需要加强';
    }
  }

  /**
   * 更新结果分析
   */
  updateResultAnalysis(result) {
    const analysisContainer = document.getElementById('result-analysis');
    if (!analysisContainer) return;

    let analysisText = '';
    let suggestions = [];

    if (result.totalScore >= 90) {
      analysisText = '恭喜您！您已达到及格标准（90分），安全知识掌握得非常好，继续保持这种学习态度。';
      suggestions = ['定期复习安全知识', '关注最新安全规范', '帮助他人提升安全意识'];
    } else {
      analysisText = `您的得分为${result.totalScore}分，未达到及格标准（90分），安全知识还需要大幅提升，建议加强学习。`;
      suggestions = ['从基础安全知识开始学习', '观看所有安全培训视频', '多次练习直到熟练掌握', '重点复习错误题目'];
    }

    analysisContainer.innerHTML = `
      <div class="analysis-content">
        <h3>结果分析</h3>
        <p class="analysis-text">${analysisText}</p>
        <div class="suggestions">
          <h4>学习建议</h4>
          <ul>
            ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * 计时器相关方法
   */
  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimer() {
    const elapsed = Date.now() - this.startTime;
    const timerText = document.getElementById('timer-text');
    if (timerText) {
      timerText.textContent = this.formatTime(elapsed);
    }
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * 其他功能方法
   */
  showAnswerReview() {
    document.getElementById('quiz-result-screen').style.display = 'none';
    document.getElementById('quiz-review-screen').style.display = 'block';
    this.renderAnswerReview();
  }

  renderAnswerReview() {
    const reviewContent = document.getElementById('review-content');
    const questions = this.quizEngine.getAllQuestions();
    const userAnswers = this.quizEngine.getUserAnswers();

    reviewContent.innerHTML = questions.map((question, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer && userAnswer.isCorrect;

      return `
        <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
          <div class="review-header">
            <span class="review-number">第${index + 1}题</span>
            <span class="review-result">${isCorrect ? '✅ 正确' : '❌ 错误'}</span>
          </div>
          <div class="review-question">
            <h4>${question.question}</h4>
            <div class="review-options">
              ${question.options.map((option, optIndex) => {
        const isUserSelected = userAnswer && userAnswer.selectedAnswers.includes(optIndex);
        const isCorrectAnswer = Array.isArray(question.correctAnswer)
          ? question.correctAnswer.includes(optIndex)
          : question.correctAnswer === optIndex;

        let className = 'review-option';
        if (isCorrectAnswer) className += ' correct-answer';
        if (isUserSelected && !isCorrectAnswer) className += ' wrong-answer';
        if (isUserSelected) className += ' user-selected';

        return `
                  <div class="${className}">
                    <span class="option-marker">${String.fromCharCode(65 + optIndex)}</span>
                    <span class="option-text">${option}</span>
                  </div>
                `;
      }).join('')}
            </div>
            <div class="review-explanation">
              <strong>解析：</strong>${question.explanation}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  backToResult() {
    document.getElementById('quiz-review-screen').style.display = 'none';
    document.getElementById('quiz-result-screen').style.display = 'block';
  }

  retakeQuiz() {
    // 重置所有状态
    this.isQuizStarted = false;
    this.quizEngine = new QuizEngine(this.currentQuizType);

    // 显示开始界面
    document.getElementById('quiz-result-screen').style.display = 'none';
    document.getElementById('quiz-review-screen').style.display = 'none';
    document.getElementById('quiz-start-screen').style.display = 'block';
    document.getElementById('quiz-stats').style.display = 'none';
  }

  /**
   * 显示自动操作提示消息
   */
  showAutoActionMessage(message, duration = 1200) {
    // 移除现有的提示
    const existingMessage = document.querySelector('.auto-action-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // 创建提示元素
    const messageElement = document.createElement('div');
    messageElement.className = 'auto-action-message';
    messageElement.innerHTML = `
      <div class="message-content">
        <div class="message-spinner"></div>
        <span class="message-text">${message}</span>
      </div>
    `;

    // 添加样式
    messageElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(37, 99, 235, 0.95);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      font-size: 14px;
      font-weight: 500;
      backdrop-filter: blur(4px);
      animation: fadeInScale 0.3s ease-out;
    `;

    // 添加内容样式
    const messageContent = messageElement.querySelector('.message-content');
    messageContent.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    // 添加旋转动画样式
    const spinner = messageElement.querySelector('.message-spinner');
    spinner.style.cssText = `
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    // 添加动画样式到页面
    if (!document.querySelector('#auto-action-styles')) {
      const styles = document.createElement('style');
      styles.id = 'auto-action-styles';
      styles.textContent = `
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styles);
    }

    // 添加到页面
    document.body.appendChild(messageElement);

    // 自动移除
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.style.animation = 'fadeInScale 0.3s ease-out reverse';
        setTimeout(() => {
          messageElement.remove();
        }, 300);
      }
    }, duration);
  }

  /**
   * 工具方法
   */
  showLoading(message = '加载中...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.querySelector('p').textContent = message;
      overlay.style.display = 'flex';
    }
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  showError(message) {
    // 简单的错误提示，可以后续优化为更好的UI
    alert(message);
  }

  showSuccess(message) {
    // 简单的成功提示，可以后续优化为更好的UI
    alert(message);
  }
}
