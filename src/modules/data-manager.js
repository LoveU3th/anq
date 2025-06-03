/**
 * 数据管理模块
 * 负责应用数据的存储、检索和同步
 */

import { Logger } from '../utils/logger.js';
import { storageManager } from '../utils/storage.js';
import { apiClient } from '../utils/api.js';
import { dataValidator, ValidationSchemas } from '../utils/validation.js';

class DataManager {
  constructor() {
    this.logger = new Logger('DataManager');
    this.userData = null;
    this.isInitialized = false;
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    this.syncQueue = [];
    this.isOnline = navigator.onLine;

    // 监听网络状态变化
    this.setupNetworkListeners();
  }

  /**
   * 初始化应用数据
   * @param {Object} options - 初始化选项
   * @returns {Object} - 初始化后的用户数据
   */
  async initAppData(options = {}) {
    try {
      this.logger.info('正在初始化应用数据...');

      // 创建默认数据结构
      const defaultData = this.createDefaultUserData();

      // 尝试从本地存储加载已有数据
      const savedData = storageManager.getLocal('userData', {});

      // 合并默认数据和已保存数据
      this.userData = this.mergeUserData(defaultData, savedData);

      // 验证数据完整性
      const validationResult = dataValidator.validateObject(this.userData, ValidationSchemas.userData);
      if (!validationResult.isValid) {
        this.logger.warn('用户数据验证失败，使用默认数据:', validationResult.errors);
        this.userData = defaultData;
      }

      // 更新访问信息
      this.updateVisitInfo();

      // 保存更新后的数据
      await this.saveAppData(this.userData);

      this.isInitialized = true;
      this.logger.info('应用数据初始化完成');

      return this.userData;
    } catch (error) {
      this.logger.error('应用数据初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建默认用户数据结构
   * @returns {Object} - 默认用户数据
   */
  createDefaultUserData() {
    const now = new Date().toISOString();
    const sessionId = this.generateSessionId();
    const deviceInfo = this.detectDeviceInfo();

    return {
      sessionId,
      deviceInfo,
      firstVisit: now,
      lastVisit: now,
      visitCount: 1,

      // 导航状态
      currentPage: '/',
      navigationHistory: ['/'],

      // 答题进度
      quizProgress: {
        safety: {
          currentQuestion: 0,
          questions: [],
          answers: [],
          correctCount: 0,
          score: 0,
          startedAt: null,
          completedAt: null,
          timeSpent: 0
        },
        violation: {
          currentQuestion: 0,
          questions: [],
          answers: [],
          correctCount: 0,
          score: 0,
          startedAt: null,
          completedAt: null,
          timeSpent: 0
        }
      },

      // 视频观看进度
      videoProgress: {
        safety: {
          watched: false,
          progress: 0,
          lastPosition: 0,
          watchedAt: null,
          watchCount: 0
        },
        violation: {
          watched: false,
          progress: 0,
          lastPosition: 0,
          watchedAt: null,
          watchCount: 0
        }
      },

      // 成就和统计
      achievements: {
        perfectScore: false,
        allVideosWatched: false,
        allQuizzesCompleted: false,
        fastestCompletion: null
      },

      // 用户偏好设置
      preferences: {
        theme: 'light',
        language: 'zh-CN',
        autoplay: true,
        notifications: true
      }
    };
  }

  /**
   * 生成唯一会话ID
   * @returns {string} - UUID v4格式的会话ID
   */
  generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 检测设备信息
   * @returns {Object} - 设备信息对象
   */
  detectDeviceInfo() {
    const userAgent = navigator.userAgent;

    // 检测设备类型
    let deviceType = 'desktop';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }

    // 检测浏览器
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'chrome';
    else if (userAgent.includes('Firefox')) browser = 'firefox';
    else if (userAgent.includes('Safari')) browser = 'safari';
    else if (userAgent.includes('Edge')) browser = 'edge';

    // 检测操作系统
    let os = 'unknown';
    if (userAgent.includes('Windows')) os = 'windows';
    else if (userAgent.includes('Mac')) os = 'macos';
    else if (userAgent.includes('Linux')) os = 'linux';
    else if (userAgent.includes('Android')) os = 'android';
    else if (userAgent.includes('iOS')) os = 'ios';

    return {
      type: deviceType,
      browser,
      os,
      screenSize: `${screen.width}x${screen.height}`,
      userAgent: userAgent.substring(0, 200) // 限制长度
    };
  }

  /**
   * 合并用户数据
   * @param {Object} defaultData - 默认数据
   * @param {Object} savedData - 保存的数据
   * @returns {Object} - 合并后的数据
   */
  mergeUserData(defaultData, savedData) {
    const merged = { ...defaultData };

    // 保留重要的用户数据
    if (savedData.sessionId) merged.sessionId = savedData.sessionId;
    if (savedData.firstVisit) merged.firstVisit = savedData.firstVisit;
    if (savedData.visitCount) merged.visitCount = savedData.visitCount;
    if (savedData.quizProgress) merged.quizProgress = { ...defaultData.quizProgress, ...savedData.quizProgress };
    if (savedData.videoProgress) merged.videoProgress = { ...defaultData.videoProgress, ...savedData.videoProgress };
    if (savedData.achievements) merged.achievements = { ...defaultData.achievements, ...savedData.achievements };
    if (savedData.preferences) merged.preferences = { ...defaultData.preferences, ...savedData.preferences };

    return merged;
  }

  /**
   * 更新访问信息
   */
  updateVisitInfo() {
    const now = new Date().toISOString();
    this.userData.lastVisit = now;
    this.userData.visitCount = (this.userData.visitCount || 0) + 1;
    this.userData.deviceInfo = this.detectDeviceInfo(); // 更新设备信息
  }

  /**
   * 保存应用数据到本地存储
   * @param {Object} data - 要保存的数据
   * @param {Object} options - 保存选项
   * @returns {boolean} - 保存是否成功
   */
  async saveAppData(data = this.userData, options = {}) {
    try {
      // 验证数据
      if (options.validate !== false) {
        const validationResult = dataValidator.validateObject(data, ValidationSchemas.userData);
        if (!validationResult.isValid) {
          this.logger.warn('数据验证失败，跳过保存:', validationResult.errors);
          return false;
        }
      }

      // 保存到本地存储
      const success = storageManager.setLocal('userData', data, {
        expires: options.expires || 30 * 24 * 60 * 60 // 30天过期
      });

      if (success) {
        this.logger.debug('用户数据保存成功');

        // 如果在线，尝试同步到服务器
        if (this.isOnline && options.sync !== false) {
          this.queueSync('userData', data);
        }
      }

      return success;
    } catch (error) {
      this.logger.error('保存应用数据失败:', error);
      return false;
    }
  }

  /**
   * 从API获取随机题目
   * @param {string} questionType - 题库类型
   * @param {Object} options - 抽取选项
   * @returns {Promise<Array>} - 随机抽取的题目数组
   */
  async getRandomQuestions(questionType, options = {}) {
    try {
      const {
        count = 10,
        difficulty,
        random = true,
        useCache = true
      } = options;

      // 构建缓存键
      const cacheKey = `questions_${questionType}_${count}_${difficulty}_${random}`;

      // 尝试从缓存获取
      if (useCache) {
        const cached = storageManager.getSession(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
          this.logger.debug('从缓存获取题目数据');
          return cached.data;
        }
      }

      // 从API获取
      const params = new URLSearchParams({
        type: questionType,
        count: count.toString(),
        random: random.toString()
      });

      if (difficulty) {
        params.append('difficulty', difficulty.toString());
      }

      const response = await apiClient.get(`questions?${params}`);

      if (response.success && response.questions) {
        // 缓存结果
        if (useCache) {
          storageManager.setSession(cacheKey, {
            data: response.questions,
            timestamp: Date.now()
          });
        }

        this.logger.info(`获取到 ${response.questions.length} 道题目`);
        return response.questions;
      } else {
        throw new Error(response.error || '获取题目失败');
      }
    } catch (error) {
      this.logger.error('获取随机题目失败:', error);
      throw error;
    }
  }

  /**
   * 记录用户行为数据
   * @param {string} action - 行为类型
   * @param {Object} data - 行为数据
   * @returns {Promise<boolean>} - 记录是否成功
   */
  async logUserAction(action, data = {}) {
    try {
      const actionData = {
        action,
        sessionId: this.userData?.sessionId,
        timestamp: new Date().toISOString(),
        deviceInfo: this.userData?.deviceInfo,
        ...data
      };

      // 如果在线，直接发送
      if (this.isOnline) {
        await apiClient.post('analytics/events', actionData);
        this.logger.debug(`用户行为记录成功: ${action}`);
        return true;
      } else {
        // 离线时加入同步队列
        this.queueSync('userAction', actionData);
        this.logger.debug(`用户行为已加入离线队列: ${action}`);
        return true;
      }
    } catch (error) {
      this.logger.error('记录用户行为失败:', error);
      // 即使失败也加入队列，等待网络恢复后重试
      this.queueSync('userAction', { action, ...data });
      return false;
    }
  }

  /**
   * 更新用户进度
   * @param {string} type - 进度类型（video/quiz）
   * @param {string} id - 内容ID
   * @param {Object} progress - 进度数据
   * @returns {Object} - 更新后的进度
   */
  updateUserProgress(type, id, progress) {
    try {
      if (!this.userData) {
        throw new Error('用户数据未初始化');
      }

      const progressKey = `${type}Progress`;
      if (!this.userData[progressKey]) {
        this.userData[progressKey] = {};
      }

      if (!this.userData[progressKey][id]) {
        this.userData[progressKey][id] = {};
      }

      // 更新进度数据
      Object.assign(this.userData[progressKey][id], progress);

      // 检查成就
      this.checkAchievements();

      // 保存数据
      this.saveAppData();

      // 记录行为
      this.logUserAction(`${type}_progress_updated`, {
        contentId: id,
        progress: progress
      });

      this.logger.debug(`${type}进度更新成功: ${id}`);
      return this.userData[progressKey][id];
    } catch (error) {
      this.logger.error('更新用户进度失败:', error);
      throw error;
    }
  }

  /**
   * 检查并更新成就
   */
  checkAchievements() {
    if (!this.userData) return;

    const achievements = this.userData.achievements;
    let hasNewAchievement = false;

    // 检查是否所有视频都已观看
    const videoProgress = this.userData.videoProgress;
    const allVideosWatched = Object.values(videoProgress).every(progress => progress.watched);
    if (allVideosWatched && !achievements.allVideosWatched) {
      achievements.allVideosWatched = true;
      hasNewAchievement = true;
      this.logger.info('获得成就: 所有视频已观看');
    }

    // 检查是否所有测试都已完成
    const quizProgress = this.userData.quizProgress;
    const allQuizzesCompleted = Object.values(quizProgress).every(progress => progress.completedAt);
    if (allQuizzesCompleted && !achievements.allQuizzesCompleted) {
      achievements.allQuizzesCompleted = true;
      hasNewAchievement = true;
      this.logger.info('获得成就: 所有测试已完成');
    }

    // 检查是否有满分记录
    const hasPerfectScore = Object.values(quizProgress).some(progress => progress.score === 100);
    if (hasPerfectScore && !achievements.perfectScore) {
      achievements.perfectScore = true;
      hasNewAchievement = true;
      this.logger.info('获得成就: 满分通过');
    }

    if (hasNewAchievement) {
      this.logUserAction('achievement_unlocked', { achievements });
    }
  }

  /**
   * 设置网络状态监听器
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.logger.info('网络连接已恢复');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.logger.warn('网络连接已断开');
    });
  }

  /**
   * 添加到同步队列
   * @param {string} type - 同步类型
   * @param {*} data - 同步数据
   */
  queueSync(type, data) {
    this.syncQueue.push({
      type,
      data,
      timestamp: Date.now()
    });

    // 限制队列大小
    if (this.syncQueue.length > 100) {
      this.syncQueue = this.syncQueue.slice(-50);
    }
  }

  /**
   * 处理同步队列
   */
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.logger.info(`开始处理同步队列，共 ${this.syncQueue.length} 项`);

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        await this.processSyncItem(item);
      } catch (error) {
        this.logger.error('同步项处理失败:', error);
        // 重新加入队列
        this.syncQueue.push(item);
      }
    }
  }

  /**
   * 处理单个同步项
   * @param {Object} item - 同步项
   */
  async processSyncItem(item) {
    const { type, data } = item;

    switch (type) {
      case 'userData':
        // 这里可以实现用户数据同步到服务器的逻辑
        this.logger.debug('用户数据同步（暂未实现服务器端）');
        break;
      case 'userAction':
        await apiClient.post('analytics/events', data);
        this.logger.debug('用户行为同步成功');
        break;
      default:
        this.logger.warn(`未知的同步类型: ${type}`);
    }
  }

  /**
   * 获取用户数据
   * @returns {Object} - 当前用户数据
   */
  getUserData() {
    return this.userData;
  }

  /**
   * 获取视频信息
   * @param {string} videoId - 视频ID
   * @returns {Promise<Object>} - 视频信息
   */
  async getVideoInfo(videoId) {
    try {
      const cacheKey = `video_${videoId}`;

      // 尝试从缓存获取
      const cached = storageManager.getSession(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        this.logger.debug('从缓存获取视频信息');
        return cached.data;
      }

      // 从API获取
      const response = await apiClient.get(`videos/${videoId}`);

      if (response.success && response.video) {
        // 缓存结果
        storageManager.setSession(cacheKey, {
          data: response.video,
          timestamp: Date.now()
        });

        return response.video;
      } else {
        throw new Error(response.error || '获取视频信息失败');
      }
    } catch (error) {
      this.logger.error('获取视频信息失败:', error);
      throw error;
    }
  }

  /**
   * 验证答案
   * @param {string} questionId - 题目ID
   * @param {number|Array} selectedAnswers - 选择的答案
   * @param {string} quizType - 测试类型
   * @returns {Promise<Object>} - 验证结果
   */
  async validateAnswer(questionId, selectedAnswers, quizType) {
    try {
      const response = await apiClient.post('validate-answer', {
        questionId,
        selectedAnswers,
        quizType
      });

      if (response.success) {
        return {
          isCorrect: response.isCorrect,
          explanation: response.explanation,
          correctAnswer: response.correctAnswer
        };
      } else {
        throw new Error(response.error || '答案验证失败');
      }
    } catch (error) {
      this.logger.error('答案验证失败:', error);
      throw error;
    }
  }

  /**
   * 获取统计数据
   * @returns {Promise<Object>} - 统计数据
   */
  async getStatistics() {
    try {
      const cacheKey = 'public_statistics';

      // 尝试从缓存获取
      const cached = storageManager.getSession(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60000) { // 1分钟缓存
        return cached.data;
      }

      // 从API获取
      const response = await apiClient.get('analytics/public');

      if (response.success && response.stats) {
        // 缓存结果
        storageManager.setSession(cacheKey, {
          data: response.stats,
          timestamp: Date.now()
        });

        return response.stats;
      } else {
        throw new Error(response.error || '获取统计数据失败');
      }
    } catch (error) {
      this.logger.error('获取统计数据失败:', error);
      // 返回默认统计数据
      return {
        totalVisits: 0,
        totalQuizzes: 0,
        averageScore: 0
      };
    }
  }

  /**
   * 导出用户数据
   * @returns {Object} - 导出的数据
   */
  exportUserData() {
    if (!this.userData) {
      throw new Error('用户数据未初始化');
    }

    return {
      exportTime: new Date().toISOString(),
      version: '1.0',
      userData: JSON.parse(JSON.stringify(this.userData))
    };
  }

  /**
   * 导入用户数据
   * @param {Object} exportedData - 导入的数据
   * @returns {boolean} - 是否成功
   */
  async importUserData(exportedData) {
    try {
      if (!exportedData || !exportedData.userData) {
        throw new Error('无效的导入数据');
      }

      // 验证导入的数据
      const validationResult = dataValidator.validateObject(
        exportedData.userData,
        ValidationSchemas.userData
      );

      if (!validationResult.isValid) {
        throw new Error('导入数据验证失败: ' + validationResult.errors.join(', '));
      }

      // 备份当前数据
      const backup = this.userData;

      try {
        // 导入新数据
        this.userData = exportedData.userData;
        await this.saveAppData();

        this.logger.info('用户数据导入成功');
        return true;
      } catch (error) {
        // 恢复备份
        this.userData = backup;
        throw error;
      }
    } catch (error) {
      this.logger.error('导入用户数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取缓存信息
   * @returns {Object} - 缓存使用情况
   */
  getCacheInfo() {
    return storageManager.getStorageInfo();
  }

  /**
   * 清理过期缓存
   * @returns {number} - 清理的项目数量
   */
  cleanExpiredCache() {
    let cleanedCount = 0;

    try {
      // 清理sessionStorage中的过期缓存
      if (typeof sessionStorage !== 'undefined') {
        const keysToRemove = [];

        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('anq_')) {
            try {
              const data = JSON.parse(sessionStorage.getItem(key));
              if (data.timestamp && Date.now() - data.timestamp > this.cacheTimeout) {
                keysToRemove.push(key);
              }
            } catch (error) {
              // 无效的缓存项，也删除
              keysToRemove.push(key);
            }
          }
        }

        keysToRemove.forEach(key => {
          sessionStorage.removeItem(key);
          cleanedCount++;
        });
      }

      this.logger.debug(`清理了 ${cleanedCount} 个过期缓存项`);
      return cleanedCount;
    } catch (error) {
      this.logger.error('清理缓存失败:', error);
      return 0;
    }
  }

  /**
   * 重置特定类型的进度
   * @param {string} type - 进度类型 (quiz/video)
   * @param {string} id - 内容ID（可选，不指定则重置所有）
   * @returns {boolean} - 是否成功
   */
  resetProgress(type, id = null) {
    try {
      if (!this.userData) {
        throw new Error('用户数据未初始化');
      }

      const progressKey = `${type}Progress`;
      if (!this.userData[progressKey]) {
        return true;
      }

      if (id) {
        // 重置特定内容的进度
        if (this.userData[progressKey][id]) {
          if (type === 'quiz') {
            this.userData[progressKey][id] = {
              currentQuestion: 0,
              questions: [],
              answers: [],
              correctCount: 0,
              score: 0,
              startedAt: null,
              completedAt: null,
              timeSpent: 0
            };
          } else if (type === 'video') {
            this.userData[progressKey][id] = {
              watched: false,
              progress: 0,
              lastPosition: 0,
              watchedAt: null,
              watchCount: 0
            };
          }
        }
      } else {
        // 重置所有进度
        if (type === 'quiz') {
          for (const quizId in this.userData[progressKey]) {
            this.userData[progressKey][quizId] = {
              currentQuestion: 0,
              questions: [],
              answers: [],
              correctCount: 0,
              score: 0,
              startedAt: null,
              completedAt: null,
              timeSpent: 0
            };
          }
        } else if (type === 'video') {
          for (const videoId in this.userData[progressKey]) {
            this.userData[progressKey][videoId] = {
              watched: false,
              progress: 0,
              lastPosition: 0,
              watchedAt: null,
              watchCount: 0
            };
          }
        }
      }

      // 重置相关成就
      this.userData.achievements.perfectScore = false;
      this.userData.achievements.allVideosWatched = false;
      this.userData.achievements.allQuizzesCompleted = false;

      // 保存数据
      this.saveAppData();

      this.logger.info(`${type}进度重置成功${id ? `: ${id}` : ''}`);
      return true;
    } catch (error) {
      this.logger.error('重置进度失败:', error);
      return false;
    }
  }

  /**
   * 清空所有数据
   * @returns {boolean} - 是否成功
   */
  clearAllData() {
    try {
      this.userData = null;
      this.syncQueue = [];
      storageManager.clearAll(true);
      this.logger.info('所有数据已清空');
      return true;
    } catch (error) {
      this.logger.error('清空数据失败:', error);
      return false;
    }
  }
}

// 创建默认数据管理器实例
const dataManager = new DataManager();

// 导出数据管理器
export { DataManager, dataManager };
export default dataManager;
