/**
 * 答题统计图表组件
 * 专门用于展示答题数据和统计分析
 */

import { ChartComponent } from './ChartComponent.js';

export class QuizStatsChart extends ChartComponent {
  constructor(container, options = {}) {
    super(container, {
      width: options.width || 600,
      height: options.height || 400,
      margin: options.margin || { top: 30, right: 30, bottom: 50, left: 60 },
      colors: options.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      ...options
    });
    
    this.quizData = null;
  }

  /**
   * 渲染答题正确率分布图
   */
  renderAccuracyDistribution(data, config = {}) {
    const distributionData = this.processAccuracyData(data);
    
    this.renderBarChart(distributionData, {
      ...config,
      showValues: true,
      title: '答题正确率分布'
    });
    
    // 添加平均正确率线
    this.addAverageAccuracyLine(distributionData);
  }

  /**
   * 渲染答题时间分析图
   */
  renderTimeAnalysis(data, config = {}) {
    const timeData = this.processTimeData(data);
    
    this.renderLineChart(timeData, {
      ...config,
      title: '答题时间趋势'
    });
    
    // 添加时间统计信息
    this.addTimeStatistics(timeData);
  }

  /**
   * 渲染题目难度分析图
   */
  renderDifficultyAnalysis(data, config = {}) {
    const difficultyData = this.processDifficultyData(data);
    
    this.renderDoughnutChart(difficultyData, {
      centerText: '难度分布',
      innerRadius: 60,
      ...config
    });
    
    // 添加难度说明
    this.addDifficultyLegend(difficultyData);
  }

  /**
   * 渲染答题成绩趋势图
   */
  renderScoreTrend(data, config = {}) {
    const scoreData = this.processScoreData(data);
    
    this.renderAreaChart(scoreData, {
      ...config,
      title: '成绩趋势分析'
    });
    
    // 添加成绩统计
    this.addScoreStatistics(scoreData);
  }

  /**
   * 渲染知识点掌握情况图
   */
  renderKnowledgePoints(data, config = {}) {
    const { width, height, margin } = this.options;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // 清空容器
    this.container.innerHTML = '';
    
    // 创建SVG
    const svg = this.createSVG(width, height);
    const chartGroup = this.createGroup(svg, margin.left, margin.top);
    
    // 处理知识点数据
    const knowledgeData = this.processKnowledgeData(data);
    const maxAccuracy = Math.max(...knowledgeData.map(d => d.accuracy));
    
    // 绘制雷达图背景
    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;
    const radius = Math.min(chartWidth, chartHeight) / 2 - 40;
    
    // 绘制同心圆
    for (let i = 1; i <= 5; i++) {
      const r = (radius * i) / 5;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', centerX);
      circle.setAttribute('cy', centerY);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', '#e5e7eb');
      circle.setAttribute('stroke-width', '1');
      chartGroup.appendChild(circle);
    }
    
    // 绘制知识点轴线
    knowledgeData.forEach((point, index) => {
      const angle = (index / knowledgeData.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // 轴线
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', centerX);
      line.setAttribute('y1', centerY);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#e5e7eb');
      line.setAttribute('stroke-width', '1');
      chartGroup.appendChild(line);
      
      // 标签
      const labelX = centerX + (radius + 20) * Math.cos(angle);
      const labelY = centerY + (radius + 20) * Math.sin(angle);
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', labelX);
      label.setAttribute('y', labelY);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('font-size', '12');
      label.setAttribute('fill', '#374151');
      label.textContent = point.name;
      chartGroup.appendChild(label);
    });
    
    // 绘制数据多边形
    const pathData = [];
    knowledgeData.forEach((point, index) => {
      const angle = (index / knowledgeData.length) * 2 * Math.PI - Math.PI / 2;
      const r = (point.accuracy / 100) * radius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      if (index === 0) {
        pathData.push(`M ${x} ${y}`);
      } else {
        pathData.push(`L ${x} ${y}`);
      }
    });
    pathData.push('Z');
    
    // 数据区域
    const dataArea = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dataArea.setAttribute('d', pathData.join(' '));
    dataArea.setAttribute('fill', this.options.colors[0]);
    dataArea.setAttribute('fill-opacity', '0.3');
    dataArea.setAttribute('stroke', this.options.colors[0]);
    dataArea.setAttribute('stroke-width', '2');
    chartGroup.appendChild(dataArea);
    
    // 数据点
    knowledgeData.forEach((point, index) => {
      const angle = (index / knowledgeData.length) * 2 * Math.PI - Math.PI / 2;
      const r = (point.accuracy / 100) * radius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', 4);
      circle.setAttribute('fill', this.options.colors[0]);
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');
      
      // 添加交互
      circle.addEventListener('mouseenter', () => {
        this.showTooltip({
          label: point.name,
          value: `${point.accuracy}%`
        }, circle);
      });
      
      chartGroup.appendChild(circle);
    });
    
    this.container.appendChild(svg);
  }

  /**
   * 处理正确率数据
   */
  processAccuracyData(data) {
    const ranges = [
      { label: '0-20%', min: 0, max: 20, value: 0 },
      { label: '20-40%', min: 20, max: 40, value: 0 },
      { label: '40-60%', min: 40, max: 60, value: 0 },
      { label: '60-80%', min: 60, max: 80, value: 0 },
      { label: '80-100%', min: 80, max: 100, value: 0 }
    ];
    
    data.forEach(quiz => {
      const accuracy = (quiz.correctAnswers / quiz.totalQuestions) * 100;
      const range = ranges.find(r => accuracy >= r.min && accuracy < r.max);
      if (range) {
        range.value++;
      }
    });
    
    return ranges;
  }

  /**
   * 处理时间数据
   */
  processTimeData(data) {
    return data.map((quiz, index) => ({
      label: `第${index + 1}次`,
      value: quiz.timeSpent || 0,
      date: quiz.completedAt
    }));
  }

  /**
   * 处理难度数据
   */
  processDifficultyData(data) {
    const difficulties = { easy: 0, medium: 0, hard: 0 };
    
    data.forEach(quiz => {
      quiz.questions?.forEach(q => {
        if (q.difficulty <= 1) difficulties.easy++;
        else if (q.difficulty <= 2) difficulties.medium++;
        else difficulties.hard++;
      });
    });
    
    return [
      { label: '简单', value: difficulties.easy },
      { label: '中等', value: difficulties.medium },
      { label: '困难', value: difficulties.hard }
    ];
  }

  /**
   * 处理成绩数据
   */
  processScoreData(data) {
    return data.map((quiz, index) => ({
      label: quiz.date || `测试${index + 1}`,
      value: quiz.score || 0,
      date: quiz.completedAt
    }));
  }

  /**
   * 处理知识点数据
   */
  processKnowledgeData(data) {
    const knowledgePoints = {};
    
    data.forEach(quiz => {
      quiz.questions?.forEach(q => {
        const category = q.category || '其他';
        if (!knowledgePoints[category]) {
          knowledgePoints[category] = { total: 0, correct: 0 };
        }
        knowledgePoints[category].total++;
        if (q.isCorrect) {
          knowledgePoints[category].correct++;
        }
      });
    });
    
    return Object.entries(knowledgePoints).map(([name, stats]) => ({
      name,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      total: stats.total,
      correct: stats.correct
    }));
  }

  /**
   * 添加平均正确率线
   */
  addAverageAccuracyLine(data) {
    const totalQuestions = data.reduce((sum, item) => sum + item.value, 0);
    const weightedSum = data.reduce((sum, item, index) => {
      const midpoint = (index * 20) + 10; // 区间中点
      return sum + (midpoint * item.value);
    }, 0);
    const average = weightedSum / totalQuestions;
    
    console.log('Average accuracy:', average.toFixed(1) + '%');
  }

  /**
   * 添加时间统计信息
   */
  addTimeStatistics(data) {
    const times = data.map(d => d.value);
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const stats = document.createElement('div');
    stats.className = 'time-statistics';
    stats.innerHTML = `
      <div class="stat-item">平均用时: ${Math.round(avgTime)}秒</div>
      <div class="stat-item">最短用时: ${minTime}秒</div>
      <div class="stat-item">最长用时: ${maxTime}秒</div>
    `;
    
    this.container.appendChild(stats);
  }

  /**
   * 添加难度说明
   */
  addDifficultyLegend(data) {
    const legend = document.createElement('div');
    legend.className = 'difficulty-legend';
    legend.innerHTML = data.map((item, index) => `
      <div class="legend-item">
        <span class="legend-color" style="background-color: ${this.options.colors[index]}"></span>
        <span>${item.label}: ${item.value}题</span>
      </div>
    `).join('');
    
    this.container.appendChild(legend);
  }

  /**
   * 添加成绩统计
   */
  addScoreStatistics(data) {
    const scores = data.map(d => d.value);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const improvement = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;
    
    const stats = document.createElement('div');
    stats.className = 'score-statistics';
    stats.innerHTML = `
      <div class="stat-item">平均分: ${Math.round(avgScore)}分</div>
      <div class="stat-item">最高分: ${bestScore}分</div>
      <div class="stat-item">进步幅度: ${improvement > 0 ? '+' : ''}${improvement}分</div>
    `;
    
    this.container.appendChild(stats);
  }

  /**
   * 更新答题数据
   */
  updateQuizData(newData) {
    this.quizData = newData;
  }

  /**
   * 导出统计数据
   */
  exportStatsData(format = 'json') {
    if (!this.quizData) {
      throw new Error('No quiz data available');
    }
    
    const statsData = {
      accuracy: this.processAccuracyData(this.quizData),
      time: this.processTimeData(this.quizData),
      difficulty: this.processDifficultyData(this.quizData),
      knowledge: this.processKnowledgeData(this.quizData)
    };
    
    if (format === 'csv') {
      return this.convertStatsToCSV(statsData);
    }
    
    return JSON.stringify(statsData, null, 2);
  }

  /**
   * 转换统计数据为CSV
   */
  convertStatsToCSV(statsData) {
    // 简化的CSV导出，实际项目中可以更详细
    const headers = ['类型', '项目', '数值'];
    const rows = [];
    
    Object.entries(statsData).forEach(([type, data]) => {
      data.forEach(item => {
        rows.push([type, item.label || item.name, item.value || item.accuracy]);
      });
    });
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}
