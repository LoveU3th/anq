/**
 * 学习进度图表组件
 * 专门用于展示用户学习进度和统计数据
 */

import { ChartComponent } from './ChartComponent.js';

export class ProgressChart extends ChartComponent {
  constructor(container, options = {}) {
    super(container, {
      width: options.width || 600,
      height: options.height || 400,
      margin: options.margin || { top: 30, right: 30, bottom: 50, left: 60 },
      colors: options.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      ...options
    });
    
    this.progressData = null;
    this.chartType = options.chartType || 'line';
  }

  /**
   * 渲染学习进度趋势图
   */
  renderProgressTrend(data, config = {}) {
    const processedData = this.processProgressData(data);
    
    switch (config.type || 'line') {
      case 'area':
        this.renderAreaChart(processedData, config);
        break;
      case 'bar':
        this.renderBarChart(processedData, config);
        break;
      default:
        this.renderLineChart(processedData, config);
    }
    
    // 添加进度标注
    this.addProgressAnnotations(processedData);
  }

  /**
   * 渲染学习完成率环形图
   */
  renderCompletionRate(data, config = {}) {
    const { completed, total } = data;
    const percentage = Math.round((completed / total) * 100);
    
    const chartData = [
      { label: '已完成', value: completed },
      { label: '未完成', value: total - completed }
    ];
    
    this.renderDoughnutChart(chartData, {
      centerText: `${percentage}%`,
      innerRadius: config.innerRadius || 80,
      ...config
    });
    
    // 添加完成率说明
    this.addCompletionLegend(chartData, percentage);
  }

  /**
   * 渲染学习时长分布图
   */
  renderStudyTimeDistribution(data, config = {}) {
    const distributionData = this.processStudyTimeData(data);
    
    this.renderBarChart(distributionData, {
      ...config,
      showValues: true
    });
    
    // 添加平均时长线
    this.addAverageTimeLine(distributionData);
  }

  /**
   * 渲染学习路径进度图
   */
  renderLearningPath(data, config = {}) {
    const { width, height, margin } = this.options;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // 清空容器
    this.container.innerHTML = '';
    
    // 创建SVG
    const svg = this.createSVG(width, height);
    const chartGroup = this.createGroup(svg, margin.left, margin.top);
    
    // 绘制学习路径
    const stepHeight = chartHeight / data.length;
    
    data.forEach((step, index) => {
      const y = index * stepHeight + stepHeight / 2;
      const progress = step.progress || 0;
      const progressWidth = (progress / 100) * chartWidth;
      
      // 背景条
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', 0);
      bgRect.setAttribute('y', y - 15);
      bgRect.setAttribute('width', chartWidth);
      bgRect.setAttribute('height', 30);
      bgRect.setAttribute('fill', '#f3f4f6');
      bgRect.setAttribute('rx', 15);
      chartGroup.appendChild(bgRect);
      
      // 进度条
      const progressRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      progressRect.setAttribute('x', 0);
      progressRect.setAttribute('y', y - 15);
      progressRect.setAttribute('width', progressWidth);
      progressRect.setAttribute('height', 30);
      progressRect.setAttribute('fill', this.getProgressColor(progress));
      progressRect.setAttribute('rx', 15);
      
      // 添加动画
      progressRect.style.width = '0';
      progressRect.style.transition = `width 1s ease ${index * 0.2}s`;
      
      chartGroup.appendChild(progressRect);
      
      // 步骤标签
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', 10);
      label.setAttribute('y', y + 5);
      label.setAttribute('font-size', '14');
      label.setAttribute('font-weight', 'bold');
      label.setAttribute('fill', progress > 50 ? 'white' : '#374151');
      label.textContent = step.name;
      chartGroup.appendChild(label);
      
      // 进度百分比
      const percentage = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      percentage.setAttribute('x', chartWidth - 10);
      percentage.setAttribute('y', y + 5);
      percentage.setAttribute('text-anchor', 'end');
      percentage.setAttribute('font-size', '12');
      percentage.setAttribute('font-weight', 'bold');
      percentage.setAttribute('fill', '#6b7280');
      percentage.textContent = `${progress}%`;
      chartGroup.appendChild(percentage);
      
      // 触发动画
      setTimeout(() => {
        progressRect.style.width = `${progressWidth}px`;
      }, 100);
    });
    
    this.container.appendChild(svg);
  }

  /**
   * 处理进度数据
   */
  processProgressData(data) {
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map(item => ({
      label: item.date || item.label,
      value: item.progress || item.value || 0,
      date: item.date,
      details: item.details
    }));
  }

  /**
   * 处理学习时长数据
   */
  processStudyTimeData(data) {
    const timeRanges = [
      { label: '0-30分钟', min: 0, max: 30, value: 0 },
      { label: '30-60分钟', min: 30, max: 60, value: 0 },
      { label: '1-2小时', min: 60, max: 120, value: 0 },
      { label: '2-4小时', min: 120, max: 240, value: 0 },
      { label: '4小时以上', min: 240, max: Infinity, value: 0 }
    ];
    
    data.forEach(session => {
      const duration = session.duration || 0; // 分钟
      const range = timeRanges.find(r => duration >= r.min && duration < r.max);
      if (range) {
        range.value++;
      }
    });
    
    return timeRanges;
  }

  /**
   * 获取进度颜色
   */
  getProgressColor(progress) {
    if (progress >= 90) return '#10b981'; // 绿色
    if (progress >= 70) return '#3b82f6'; // 蓝色
    if (progress >= 50) return '#f59e0b'; // 黄色
    if (progress >= 30) return '#f97316'; // 橙色
    return '#ef4444'; // 红色
  }

  /**
   * 添加进度标注
   */
  addProgressAnnotations(data) {
    // 找到最高和最低点
    const maxPoint = data.reduce((max, item) => item.value > max.value ? item : max, data[0]);
    const minPoint = data.reduce((min, item) => item.value < min.value ? item : min, data[0]);
    
    // 这里可以添加标注逻辑
    console.log('Progress annotations:', { maxPoint, minPoint });
  }

  /**
   * 添加完成率说明
   */
  addCompletionLegend(data, percentage) {
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    legend.innerHTML = `
      <div class="legend-item">
        <span class="legend-color" style="background-color: ${this.options.colors[0]}"></span>
        <span>已完成: ${data[0].value}</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background-color: ${this.options.colors[1]}"></span>
        <span>未完成: ${data[1].value}</span>
      </div>
      <div class="legend-summary">
        总完成率: ${percentage}%
      </div>
    `;
    
    this.container.appendChild(legend);
  }

  /**
   * 添加平均时长线
   */
  addAverageTimeLine(data) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const average = total / data.length;
    
    // 这里可以在图表上添加平均线
    console.log('Average study time:', average);
  }

  /**
   * 更新进度数据
   */
  updateProgress(newData) {
    this.progressData = newData;
    // 根据当前图表类型重新渲染
    this.renderProgressTrend(newData);
  }

  /**
   * 导出进度数据
   */
  exportProgressData(format = 'json') {
    if (!this.progressData) {
      throw new Error('No progress data available');
    }
    
    if (format === 'csv') {
      return this.convertToCSV(this.progressData);
    }
    
    return JSON.stringify(this.progressData, null, 2);
  }

  /**
   * 转换为CSV格式
   */
  convertToCSV(data) {
    const headers = ['日期', '进度', '详情'];
    const rows = data.map(item => [
      item.date || item.label,
      item.value,
      item.details || ''
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}
