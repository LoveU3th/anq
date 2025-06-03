/**
 * 图表组件
 * 提供简单的数据可视化功能，不依赖外部图表库
 */

export class ChartComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: options.width || 400,
      height: options.height || 300,
      margin: options.margin || { top: 20, right: 20, bottom: 40, left: 40 },
      colors: options.colors || ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      ...options
    };
    this.data = [];
  }

  /**
   * 渲染柱状图
   */
  renderBarChart(data, config = {}) {
    this.data = data;
    const { width, height, margin, colors } = this.options;
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // 清空容器
    this.container.innerHTML = '';
    
    // 创建SVG
    const svg = this.createSVG(width, height);
    const chartGroup = this.createGroup(svg, margin.left, margin.top);
    
    // 计算数据范围
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;
    
    // 绘制柱子
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = index * (barWidth + barSpacing) + barSpacing / 2;
      const y = chartHeight - barHeight;
      
      // 创建柱子
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('fill', colors[index % colors.length]);
      rect.setAttribute('rx', 4);
      rect.classList.add('chart-bar');
      
      // 添加动画
      rect.style.opacity = '0';
      rect.style.transform = 'scaleY(0)';
      rect.style.transformOrigin = 'bottom';
      rect.style.transition = `all 0.6s ease ${index * 0.1}s`;
      
      chartGroup.appendChild(rect);
      
      // 添加数值标签
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + barWidth / 2);
      text.setAttribute('y', y - 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#374151');
      text.textContent = item.value;
      chartGroup.appendChild(text);
      
      // 添加标签
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x + barWidth / 2);
      label.setAttribute('y', chartHeight + 20);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '11');
      label.setAttribute('fill', '#6b7280');
      label.textContent = item.label;
      chartGroup.appendChild(label);
      
      // 触发动画
      setTimeout(() => {
        rect.style.opacity = '1';
        rect.style.transform = 'scaleY(1)';
      }, 100);
    });
    
    // 添加坐标轴
    this.addAxes(chartGroup, chartWidth, chartHeight, maxValue);
    
    this.container.appendChild(svg);
  }

  /**
   * 渲染折线图
   */
  renderLineChart(data, config = {}) {
    this.data = data;
    const { width, height, margin, colors } = this.options;
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // 清空容器
    this.container.innerHTML = '';
    
    // 创建SVG
    const svg = this.createSVG(width, height);
    const chartGroup = this.createGroup(svg, margin.left, margin.top);
    
    // 计算数据范围
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue;
    
    // 计算点的位置
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - ((item.value - minValue) / valueRange) * chartHeight;
      return { x, y, ...item };
    });
    
    // 创建路径
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', colors[0]);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.classList.add('chart-line');
    
    // 添加路径动画
    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = pathLength;
    path.style.strokeDashoffset = pathLength;
    path.style.transition = 'stroke-dashoffset 1.5s ease-in-out';
    
    chartGroup.appendChild(path);
    
    // 添加数据点
    points.forEach((point, index) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);
      circle.setAttribute('r', 4);
      circle.setAttribute('fill', colors[0]);
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');
      circle.classList.add('chart-point');
      
      // 添加点击事件
      circle.addEventListener('click', () => {
        this.showTooltip(point, circle);
      });
      
      // 添加动画
      circle.style.opacity = '0';
      circle.style.transform = 'scale(0)';
      circle.style.transition = `all 0.3s ease ${index * 0.1 + 1}s`;
      
      chartGroup.appendChild(circle);
      
      // 触发动画
      setTimeout(() => {
        circle.style.opacity = '1';
        circle.style.transform = 'scale(1)';
      }, 100);
    });
    
    // 添加坐标轴
    this.addAxes(chartGroup, chartWidth, chartHeight, maxValue, minValue);
    
    // 触发路径动画
    setTimeout(() => {
      path.style.strokeDashoffset = '0';
    }, 100);
    
    this.container.appendChild(svg);
  }

  /**
   * 渲染饼图
   */
  renderPieChart(data, config = {}) {
    this.data = data;
    const { width, height, colors } = this.options;
    
    const radius = Math.min(width, height) / 2 - 20;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 清空容器
    this.container.innerHTML = '';
    
    // 创建SVG
    const svg = this.createSVG(width, height);
    
    // 计算总值
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    let currentAngle = 0;
    
    data.forEach((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 2 * Math.PI;
      
      // 计算路径
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', colors[index % colors.length]);
      path.setAttribute('stroke', 'white');
      path.setAttribute('stroke-width', '2');
      path.classList.add('chart-slice');
      
      // 添加动画
      path.style.opacity = '0';
      path.style.transform = 'scale(0)';
      path.style.transformOrigin = `${centerX}px ${centerY}px`;
      path.style.transition = `all 0.6s ease ${index * 0.1}s`;
      
      svg.appendChild(path);
      
      // 添加标签
      const labelAngle = startAngle + angle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos(labelAngle);
      const labelY = centerY + labelRadius * Math.sin(labelAngle);
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', labelX);
      text.setAttribute('y', labelY);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', 'white');
      text.setAttribute('font-weight', 'bold');
      text.textContent = `${Math.round(percentage * 100)}%`;
      svg.appendChild(text);
      
      currentAngle += angle;
      
      // 触发动画
      setTimeout(() => {
        path.style.opacity = '1';
        path.style.transform = 'scale(1)';
      }, 100);
    });
    
    this.container.appendChild(svg);
  }

  /**
   * 创建SVG元素
   */
  createSVG(width, height) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.overflow = 'visible';
    return svg;
  }

  /**
   * 创建组元素
   */
  createGroup(parent, x, y) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${x}, ${y})`);
    parent.appendChild(group);
    return group;
  }

  /**
   * 添加坐标轴
   */
  addAxes(group, width, height, maxValue, minValue = 0) {
    // Y轴
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', 0);
    yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', 0);
    yAxis.setAttribute('y2', height);
    yAxis.setAttribute('stroke', '#e5e7eb');
    yAxis.setAttribute('stroke-width', '1');
    group.appendChild(yAxis);
    
    // X轴
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 0);
    xAxis.setAttribute('y1', height);
    xAxis.setAttribute('x2', width);
    xAxis.setAttribute('y2', height);
    xAxis.setAttribute('stroke', '#e5e7eb');
    xAxis.setAttribute('stroke-width', '1');
    group.appendChild(xAxis);
    
    // Y轴刻度
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = minValue + (maxValue - minValue) * (i / steps);
      const y = height - (i / steps) * height;
      
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', -5);
      tick.setAttribute('y1', y);
      tick.setAttribute('x2', 0);
      tick.setAttribute('y2', y);
      tick.setAttribute('stroke', '#9ca3af');
      tick.setAttribute('stroke-width', '1');
      group.appendChild(tick);
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', -10);
      label.setAttribute('y', y);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', '#6b7280');
      label.textContent = Math.round(value);
      group.appendChild(label);
    }
  }

  /**
   * 显示提示框
   */
  showTooltip(data, element) {
    // 移除现有提示框
    const existingTooltip = document.querySelector('.chart-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-content">
        <strong>${data.label}</strong><br>
        值: ${data.value}
      </div>
    `;
    
    // 定位提示框
    const rect = element.getBoundingClientRect();
    tooltip.style.position = 'absolute';
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    tooltip.style.top = `${rect.top + window.scrollY - 40}px`;
    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '1000';
    tooltip.style.pointerEvents = 'none';
    
    document.body.appendChild(tooltip);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.remove();
      }
    }, 3000);
  }

  /**
   * 更新数据
   */
  updateData(newData) {
    this.data = newData;
    // 重新渲染图表
    // 这里可以根据当前图表类型调用相应的渲染方法
  }

  /**
   * 销毁图表
   */
  destroy() {
    this.container.innerHTML = '';
    this.data = [];
  }
}
