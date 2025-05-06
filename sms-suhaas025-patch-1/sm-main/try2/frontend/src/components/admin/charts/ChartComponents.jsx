import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ChartComponents = ({ type, data, colors = {}, options = {} }) => {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  switch (type) {
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[entry.name] || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value, name) => [`${value} students`, `Grade ${name}`]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            layout={options.layout || 'horizontal'}
          >
            <CartesianGrid strokeDasharray="3 3" />
            {options.layout === 'vertical' ? (
              <>
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey={options.labelKey || 'name'} type="category" width={150} />
              </>
            ) : (
              <>
                <XAxis dataKey={options.labelKey || 'name'} />
                <YAxis domain={[0, options.maxY || 100]} />
              </>
            )}
            <RechartsTooltip formatter={options.tooltipFormatter} />
            <Legend />
            {options.bars ? (
              options.bars.map((bar, index) => (
                <Bar 
                  key={index}
                  dataKey={bar.dataKey} 
                  name={bar.name} 
                  fill={bar.color || COLORS[index % COLORS.length]} 
                  stackId={bar.stackId}
                />
              ))
            ) : (
              <Bar dataKey={options.dataKey || 'value'} name={options.name || 'Value'} fill={options.color || '#8884d8'} />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
      
    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={options.labelKey || 'name'} />
            {options.multiAxis ? (
              <>
                <YAxis yAxisId="left" domain={[0, options.leftMax || 100]} />
                <YAxis yAxisId="right" orientation="right" domain={options.rightDomain || ['auto', 'auto']} />
              </>
            ) : (
              <YAxis domain={[0, options.maxY || 100]} />
            )}
            <RechartsTooltip />
            <Legend />
            {options.lines ? (
              options.lines.map((line, index) => (
                <Line 
                  key={index}
                  type="monotone" 
                  dataKey={line.dataKey} 
                  name={line.name} 
                  stroke={line.color || COLORS[index % COLORS.length]} 
                  yAxisId={line.yAxisId}
                  activeDot={line.activeDot}
                />
              ))
            ) : (
              <Line 
                type="monotone" 
                dataKey={options.dataKey || 'value'} 
                name={options.name || 'Value'} 
                stroke={options.color || '#8884d8'} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );

    default:
      return <div>Chart type not supported</div>;
  }
};

export default ChartComponents; 