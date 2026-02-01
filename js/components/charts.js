// VocabMaster Pro - Simple Charts (No external library)

const Charts = {
    // Create a simple line chart
    line(container, data, options = {}) {
        const {
            labels = [],
            values = [],
            color = 'var(--accent-primary)',
            showDots = true,
            showArea = true,
            height = 200
        } = { ...options, ...data };

        const width = container.offsetWidth || 300;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxValue = Math.max(...values, 1);
        const minValue = Math.min(...values, 0);
        const range = maxValue - minValue || 1;

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Generate points
        const points = values.map((val, i) => {
            const x = padding + (i / (values.length - 1 || 1)) * chartWidth;
            const y = padding + chartHeight - ((val - minValue) / range) * chartHeight;
            return { x, y, value: val, label: labels[i] };
        });

        // Draw area
        if (showArea && points.length > 1) {
            const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathD = `M ${points[0].x} ${padding + chartHeight} ` +
                points.map(p => `L ${p.x} ${p.y}`).join(' ') +
                ` L ${points[points.length - 1].x} ${padding + chartHeight} Z`;

            areaPath.setAttribute('d', pathD);
            areaPath.setAttribute('fill', color);
            areaPath.setAttribute('fill-opacity', '0.1');
            svg.appendChild(areaPath);
        }

        // Draw line
        if (points.length > 1) {
            const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

            linePath.setAttribute('d', pathD);
            linePath.setAttribute('fill', 'none');
            linePath.setAttribute('stroke', color);
            linePath.setAttribute('stroke-width', '2');
            linePath.setAttribute('stroke-linecap', 'round');
            linePath.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(linePath);
        }

        // Draw dots
        if (showDots) {
            points.forEach(p => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', p.x);
                circle.setAttribute('cy', p.y);
                circle.setAttribute('r', '4');
                circle.setAttribute('fill', color);
                circle.setAttribute('stroke', 'var(--bg-card)');
                circle.setAttribute('stroke-width', '2');

                // Tooltip on hover
                const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                title.textContent = `${p.label || ''}: ${p.value}`;
                circle.appendChild(title);

                svg.appendChild(circle);
            });
        }

        // Draw Y axis labels
        const yLabels = [minValue, Math.round((maxValue + minValue) / 2), maxValue];
        yLabels.forEach((val, i) => {
            const y = padding + chartHeight - (i / 2) * chartHeight;
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding - 10);
            text.setAttribute('y', y + 4);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('fill', 'var(--text-tertiary)');
            text.setAttribute('font-size', '10');
            text.textContent = val;
            svg.appendChild(text);
        });

        // Draw X axis labels (show only some if many)
        const step = Math.ceil(labels.length / 7);
        labels.forEach((label, i) => {
            if (i % step === 0 || i === labels.length - 1) {
                const x = padding + (i / (labels.length - 1 || 1)) * chartWidth;
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', height - 10);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', 'var(--text-tertiary)');
                text.setAttribute('font-size', '10');
                text.textContent = label;
                svg.appendChild(text);
            }
        });

        container.innerHTML = '';
        container.appendChild(svg);
    },

    // Create a bar chart
    bar(container, data, options = {}) {
        const {
            labels = [],
            values = [],
            colors = [],
            height = 200
        } = { ...options, ...data };

        const width = container.offsetWidth || 300;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxValue = Math.max(...values, 1);
        const barWidth = (chartWidth / values.length) * 0.7;
        const barGap = (chartWidth / values.length) * 0.3;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Default color palette
        const defaultColors = [
            'var(--accent-primary)', 'var(--success)', 'var(--info)',
            'var(--warning)', 'var(--error)', 'var(--accent-secondary)'
        ];

        // Draw bars
        values.forEach((val, i) => {
            const barHeight = (val / maxValue) * chartHeight;
            const x = padding + i * (barWidth + barGap) + barGap / 2;
            const y = padding + chartHeight - barHeight;
            const color = colors[i] || defaultColors[i % defaultColors.length];

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', color);
            rect.setAttribute('rx', '4');

            // Animation
            rect.style.transform = 'scaleY(0)';
            rect.style.transformOrigin = 'bottom';
            rect.style.transition = `transform 0.5s ease-out ${i * 0.1}s`;

            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${labels[i] || ''}: ${val}`;
            rect.appendChild(title);

            svg.appendChild(rect);

            // Value on top
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + barWidth / 2);
            text.setAttribute('y', y - 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'var(--text-secondary)');
            text.setAttribute('font-size', '11');
            text.setAttribute('font-weight', '500');
            text.textContent = val;
            svg.appendChild(text);

            // Label below
            const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            labelText.setAttribute('x', x + barWidth / 2);
            labelText.setAttribute('y', height - 10);
            labelText.setAttribute('text-anchor', 'middle');
            labelText.setAttribute('fill', 'var(--text-tertiary)');
            labelText.setAttribute('font-size', '10');
            labelText.textContent = labels[i] || '';
            svg.appendChild(labelText);
        });

        container.innerHTML = '';
        container.appendChild(svg);

        // Trigger animation
        requestAnimationFrame(() => {
            svg.querySelectorAll('rect').forEach(rect => {
                rect.style.transform = 'scaleY(1)';
            });
        });
    },

    // Create a pie/donut chart
    pie(container, data, options = {}) {
        const {
            labels = [],
            values = [],
            colors = [],
            donut = true,
            size = 200
        } = { ...options, ...data };

        const total = values.reduce((a, b) => a + b, 0);
        if (total === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-tertiary);">Veri yok</p>';
            return;
        }

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 10;
        const innerRadius = donut ? radius * 0.6 : 0;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

        const defaultColors = [
            '#C9A227', '#4CAF50', '#42A5F5', '#FFA726', '#EF5350',
            '#AB47BC', '#26A69A', '#78909C'
        ];

        let currentAngle = -Math.PI / 2;

        values.forEach((val, i) => {
            if (val === 0) return;

            const sliceAngle = (val / total) * Math.PI * 2;
            const endAngle = currentAngle + sliceAngle;
            const color = colors[i] || defaultColors[i % defaultColors.length];

            // Calculate path
            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);

            const x3 = centerX + innerRadius * Math.cos(endAngle);
            const y3 = centerY + innerRadius * Math.sin(endAngle);
            const x4 = centerX + innerRadius * Math.cos(currentAngle);
            const y4 = centerY + innerRadius * Math.sin(currentAngle);

            const largeArc = sliceAngle > Math.PI ? 1 : 0;

            let pathD;
            if (donut) {
                pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                         L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
            } else {
                pathD = `M ${centerX} ${centerY} L ${x1} ${y1}
                         A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathD);
            path.setAttribute('fill', color);
            path.style.transition = 'transform 0.2s ease';
            path.style.transformOrigin = `${centerX}px ${centerY}px`;

            // Hover effect
            path.addEventListener('mouseenter', () => {
                path.style.transform = 'scale(1.05)';
            });
            path.addEventListener('mouseleave', () => {
                path.style.transform = 'scale(1)';
            });

            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${labels[i] || ''}: ${val} (${Math.round((val / total) * 100)}%)`;
            path.appendChild(title);

            svg.appendChild(path);
            currentAngle = endAngle;
        });

        // Center text for donut
        if (donut) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', centerX);
            text.setAttribute('y', centerY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'var(--text-primary)');
            text.setAttribute('font-size', '24');
            text.setAttribute('font-weight', 'bold');
            text.textContent = total;
            svg.appendChild(text);

            const subtext = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            subtext.setAttribute('x', centerX);
            subtext.setAttribute('y', centerY + 20);
            subtext.setAttribute('text-anchor', 'middle');
            subtext.setAttribute('fill', 'var(--text-tertiary)');
            subtext.setAttribute('font-size', '12');
            subtext.textContent = 'Toplam';
            svg.appendChild(subtext);
        }

        // Legend
        const legendDiv = document.createElement('div');
        legendDiv.style.cssText = 'display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 16px;';

        labels.forEach((label, i) => {
            if (values[i] === 0) return;

            const item = document.createElement('div');
            item.style.cssText = 'display: flex; align-items: center; gap: 6px; font-size: 12px;';

            const dot = document.createElement('span');
            dot.style.cssText = `width: 12px; height: 12px; border-radius: 3px; background: ${colors[i] || defaultColors[i % defaultColors.length]};`;

            const text = document.createElement('span');
            text.style.color = 'var(--text-secondary)';
            text.textContent = `${label} (${Math.round((values[i] / total) * 100)}%)`;

            item.appendChild(dot);
            item.appendChild(text);
            legendDiv.appendChild(item);
        });

        container.innerHTML = '';
        container.style.textAlign = 'center';
        container.appendChild(svg);
        container.appendChild(legendDiv);
    },

    // Create progress ring
    progressRing(container, value, max = 100, options = {}) {
        const {
            size = 120,
            strokeWidth = 8,
            color = 'var(--accent-primary)',
            showLabel = true,
            label = ''
        } = options;

        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const percent = Math.min(100, Math.max(0, (value / max) * 100));
        const offset = circumference - (percent / 100) * circumference;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.style.transform = 'rotate(-90deg)';

        // Background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', size / 2);
        bgCircle.setAttribute('cy', size / 2);
        bgCircle.setAttribute('r', radius);
        bgCircle.setAttribute('fill', 'none');
        bgCircle.setAttribute('stroke', 'var(--bg-secondary)');
        bgCircle.setAttribute('stroke-width', strokeWidth);
        svg.appendChild(bgCircle);

        // Progress circle
        const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        progressCircle.setAttribute('cx', size / 2);
        progressCircle.setAttribute('cy', size / 2);
        progressCircle.setAttribute('r', radius);
        progressCircle.setAttribute('fill', 'none');
        progressCircle.setAttribute('stroke', color);
        progressCircle.setAttribute('stroke-width', strokeWidth);
        progressCircle.setAttribute('stroke-linecap', 'round');
        progressCircle.setAttribute('stroke-dasharray', circumference);
        progressCircle.setAttribute('stroke-dashoffset', circumference);
        progressCircle.style.transition = 'stroke-dashoffset 1s ease-out';
        svg.appendChild(progressCircle);

        // Label
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position: relative; display: inline-block;';
        wrapper.appendChild(svg);

        if (showLabel) {
            const labelDiv = document.createElement('div');
            labelDiv.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
            `;
            labelDiv.innerHTML = `
                <div style="font-size: 24px; font-weight: bold; color: var(--text-primary);">${value}</div>
                ${label ? `<div style="font-size: 12px; color: var(--text-tertiary);">${label}</div>` : ''}
            `;
            wrapper.appendChild(labelDiv);
        }

        container.innerHTML = '';
        container.appendChild(wrapper);

        // Animate
        requestAnimationFrame(() => {
            progressCircle.setAttribute('stroke-dashoffset', offset);
        });
    }
};

// Make globally available
window.Charts = Charts;
