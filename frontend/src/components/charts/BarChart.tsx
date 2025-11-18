import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface BarChartDataItem {
  name: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarChartDataItem[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
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

function BarChart({
  data,
  title,
  xAxisLabel,
  yAxisLabel,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = false,
  showGrid = true,
  ariaLabel,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="chart-empty"
        role="img"
        aria-label={ariaLabel || 'Empty bar chart'}
      >
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="chart-container" role="img" aria-label={ariaLabel || title || 'Bar chart'}>
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis 
            dataKey="name" 
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
          />
          <YAxis 
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
          />
          {showLegend && <Legend />}
          <Bar dataKey="value" name={yAxisLabel || 'Value'}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || colors[index % colors.length]} 
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BarChart;
