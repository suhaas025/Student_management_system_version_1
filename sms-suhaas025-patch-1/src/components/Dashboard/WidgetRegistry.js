import React from 'react';

// Example widget components (to be implemented or replaced)
export function CardWidget({ config, ...props }) {
  return <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, background: '#fff' }}>
    <h3>{config.title || 'Card Widget'}</h3>
    <div>{config.description}</div>
  </div>;
}

export function ListWidget({ config, ...props }) {
  return <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, background: '#fff' }}>
    <h3>{config.title || 'List Widget'}</h3>
    <ul>{(config.items || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
  </div>;
}

export function ChartWidget({ config, ...props }) {
  // Placeholder for chart (could use recharts, chart.js, etc.)
  return <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, background: '#fff' }}>
    <h3>{config.title || 'Chart Widget'}</h3>
    <div>Chart goes here (type: {config.chartType || 'bar'})</div>
  </div>;
}

export function DefaultWidget({ config, ...props }) {
  return <div style={{ border: '1px dashed #aaa', borderRadius: 8, padding: 16, background: '#fafafa' }}>
    <h3>{config.title || 'Unknown Widget'}</h3>
    <div>Component type not recognized.</div>
  </div>;
}

const registry = {
  card: CardWidget,
  list: ListWidget,
  chart: ChartWidget,
};

export function getWidgetComponent(type) {
  return registry[type] || DefaultWidget;
} 