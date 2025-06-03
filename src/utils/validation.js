/**
 * 数据验证工具
 * 提供数据完整性和格式验证功能
 */

import { Logger } from './logger.js';

class DataValidator {
  constructor() {
    this.logger = new Logger('DataValidator');
  }

  /**
   * 验证是否为有效的字符串
   * @param {*} value - 要验证的值
   * @param {Object} options - 验证选项
   * @returns {boolean} - 是否有效
   */
  isValidString(value, options = {}) {
    if (typeof value !== 'string') {
      return false;
    }

    const { minLength = 0, maxLength = Infinity, pattern } = options;

    if (value.length < minLength || value.length > maxLength) {
      return false;
    }

    if (pattern && !pattern.test(value)) {
      return false;
    }

    return true;
  }

  /**
   * 验证是否为有效的数字
   * @param {*} value - 要验证的值
   * @param {Object} options - 验证选项
   * @returns {boolean} - 是否有效
   */
  isValidNumber(value, options = {}) {
    if (typeof value !== 'number' || isNaN(value)) {
      return false;
    }

    const { min = -Infinity, max = Infinity, integer = false } = options;

    if (value < min || value > max) {
      return false;
    }

    if (integer && !Number.isInteger(value)) {
      return false;
    }

    return true;
  }

  /**
   * 验证是否为有效的数组
   * @param {*} value - 要验证的值
   * @param {Object} options - 验证选项
   * @returns {boolean} - 是否有效
   */
  isValidArray(value, options = {}) {
    if (!Array.isArray(value)) {
      return false;
    }

    const { minLength = 0, maxLength = Infinity, itemValidator } = options;

    if (value.length < minLength || value.length > maxLength) {
      return false;
    }

    if (itemValidator) {
      return value.every(item => itemValidator(item));
    }

    return true;
  }

  /**
   * 验证是否为有效的对象
   * @param {*} value - 要验证的值
   * @param {Object} schema - 对象结构定义
   * @returns {Object} - 验证结果
   */
  validateObject(value, schema) {
    const result = {
      isValid: true,
      errors: []
    };

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      result.isValid = false;
      result.errors.push('值必须是一个对象');
      return result;
    }

    // 验证必需字段
    for (const [key, fieldSchema] of Object.entries(schema)) {
      const fieldValue = value[key];
      const fieldResult = this.validateField(fieldValue, fieldSchema, key);
      
      if (!fieldResult.isValid) {
        result.isValid = false;
        result.errors.push(...fieldResult.errors);
      }
    }

    return result;
  }

  /**
   * 验证单个字段
   * @param {*} value - 字段值
   * @param {Object} fieldSchema - 字段结构定义
   * @param {string} fieldName - 字段名称
   * @returns {Object} - 验证结果
   */
  validateField(value, fieldSchema, fieldName) {
    const result = {
      isValid: true,
      errors: []
    };

    const { type, required = false, validator, defaultValue } = fieldSchema;

    // 检查必需字段
    if (required && (value === undefined || value === null)) {
      result.isValid = false;
      result.errors.push(`字段 ${fieldName} 是必需的`);
      return result;
    }

    // 如果字段不是必需的且值为空，则跳过验证
    if (!required && (value === undefined || value === null)) {
      return result;
    }

    // 类型验证
    if (type && !this.validateType(value, type, fieldSchema)) {
      result.isValid = false;
      result.errors.push(`字段 ${fieldName} 类型不正确，期望: ${type}`);
    }

    // 自定义验证器
    if (validator && typeof validator === 'function') {
      try {
        const customResult = validator(value);
        if (!customResult) {
          result.isValid = false;
          result.errors.push(`字段 ${fieldName} 自定义验证失败`);
        }
      } catch (error) {
        result.isValid = false;
        result.errors.push(`字段 ${fieldName} 验证器执行失败: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * 验证数据类型
   * @param {*} value - 要验证的值
   * @param {string} type - 期望的类型
   * @param {Object} options - 类型选项
   * @returns {boolean} - 是否匹配类型
   */
  validateType(value, type, options = {}) {
    switch (type) {
      case 'string':
        return this.isValidString(value, options);
      case 'number':
        return this.isValidNumber(value, options);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return this.isValidArray(value, options);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'date':
        return value instanceof Date || this.isValidDateString(value);
      case 'email':
        return this.isValidEmail(value);
      case 'url':
        return this.isValidURL(value);
      case 'uuid':
        return this.isValidUUID(value);
      default:
        this.logger.warn(`未知的验证类型: ${type}`);
        return true;
    }
  }

  /**
   * 验证是否为有效的日期字符串
   * @param {*} value - 要验证的值
   * @returns {boolean} - 是否有效
   */
  isValidDateString(value) {
    if (typeof value !== 'string') {
      return false;
    }
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * 验证是否为有效的邮箱地址
   * @param {*} value - 要验证的值
   * @returns {boolean} - 是否有效
   */
  isValidEmail(value) {
    if (typeof value !== 'string') {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * 验证是否为有效的URL
   * @param {*} value - 要验证的值
   * @returns {boolean} - 是否有效
   */
  isValidURL(value) {
    if (typeof value !== 'string') {
      return false;
    }
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证是否为有效的UUID
   * @param {*} value - 要验证的值
   * @returns {boolean} - 是否有效
   */
  isValidUUID(value) {
    if (typeof value !== 'string') {
      return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * 清理和标准化数据
   * @param {*} data - 要清理的数据
   * @param {Object} schema - 数据结构定义
   * @returns {*} - 清理后的数据
   */
  sanitizeData(data, schema) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = {};

    for (const [key, fieldSchema] of Object.entries(schema)) {
      const value = data[key];
      const { type, defaultValue, sanitizer } = fieldSchema;

      let sanitizedValue = value;

      // 应用默认值
      if (sanitizedValue === undefined && defaultValue !== undefined) {
        sanitizedValue = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
      }

      // 类型转换
      if (sanitizedValue !== undefined && sanitizedValue !== null) {
        sanitizedValue = this.convertType(sanitizedValue, type);
      }

      // 自定义清理器
      if (sanitizer && typeof sanitizer === 'function') {
        try {
          sanitizedValue = sanitizer(sanitizedValue);
        } catch (error) {
          this.logger.warn(`字段 ${key} 清理失败:`, error);
        }
      }

      sanitized[key] = sanitizedValue;
    }

    return sanitized;
  }

  /**
   * 类型转换
   * @param {*} value - 要转换的值
   * @param {string} type - 目标类型
   * @returns {*} - 转换后的值
   */
  convertType(value, type) {
    try {
      switch (type) {
        case 'string':
          return String(value);
        case 'number':
          const num = Number(value);
          return isNaN(num) ? value : num;
        case 'boolean':
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
          }
          return Boolean(value);
        case 'date':
          if (typeof value === 'string' || typeof value === 'number') {
            const date = new Date(value);
            return isNaN(date.getTime()) ? value : date;
          }
          return value;
        default:
          return value;
      }
    } catch (error) {
      this.logger.warn(`类型转换失败: ${type}`, error);
      return value;
    }
  }
}

// 预定义的验证模式
const ValidationSchemas = {
  // 用户数据验证模式
  userData: {
    sessionId: { type: 'uuid', required: true },
    deviceInfo: {
      type: 'object',
      required: true,
      validator: (value) => {
        const deviceSchema = {
          type: { type: 'string', required: true },
          browser: { type: 'string', required: true },
          os: { type: 'string', required: true }
        };
        const validator = new DataValidator();
        return validator.validateObject(value, deviceSchema).isValid;
      }
    },
    firstVisit: { type: 'date', required: true },
    lastVisit: { type: 'date', required: true },
    visitCount: { type: 'number', required: true, min: 0, integer: true }
  },

  // 答题进度验证模式
  quizProgress: {
    currentQuestion: { type: 'number', required: true, min: 0, integer: true },
    questions: { type: 'array', required: true },
    answers: { type: 'array', required: true },
    correctCount: { type: 'number', required: true, min: 0, integer: true },
    score: { type: 'number', required: true, min: 0 },
    startedAt: { type: 'date', required: false },
    completedAt: { type: 'date', required: false },
    timeSpent: { type: 'number', required: true, min: 0 }
  },

  // 视频进度验证模式
  videoProgress: {
    watched: { type: 'boolean', required: true },
    progress: { type: 'number', required: true, min: 0, max: 100 },
    lastPosition: { type: 'number', required: true, min: 0 },
    watchedAt: { type: 'date', required: false },
    watchCount: { type: 'number', required: true, min: 0, integer: true }
  }
};

// 创建默认验证器实例
const dataValidator = new DataValidator();

// 导出验证器和验证模式
export { DataValidator, ValidationSchemas, dataValidator };
export default dataValidator;
