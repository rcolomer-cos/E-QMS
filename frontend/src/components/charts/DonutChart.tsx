import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export interface DonutChartDataItem {
  name: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutChartDataItem[];
  title?: string;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showPercentage?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  ariaLabel?: string;
}

const DEFAULT_COLORS = [
  '#007bff', // Primary blue
  '#28a745', // Success green
  '#ffc107', // Warning yellow
  '#dc3545', // Danger red
  '#6c757d', // Secondary gray
  '#17a2b8', // Info cyan
  '#6610f2', // Indigo
  '#e83e8c', // Pink
];

const renderCustomLabel = (entry: DonutChartDataItem & { percent?: number }, showPercentage: boolean) => {
  if (showPercentage && entry.percent !== undefined) {
    return `${(entry.percent * 100).toFixed(1)}%`;
  }
  return entry.value.toString();
};

function DonutChart({
  data,
  title,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
  showPercentage = true,
  innerRadius = 60,
  outerRadius = 100,
  ariaLabel,
}: DonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="chart-empty"
        role="img"
        aria-label={ariaLabel || 'Empty donut chart'}
      >
        <p>No data available</p>
      </div>
    );
  }

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="chart-container" role="img" aria-label={ariaLabel || title || 'Donut chart'}>
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            label={(entry) => renderCustomLabel(entry, showPercentage)}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
            formatter={(value: number) => {
              const percentage = ((value / total) * 100).toFixed(1);
              return `${value} (${percentage}%)`;
            }}
          />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DonutChart;
