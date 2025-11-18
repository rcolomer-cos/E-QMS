import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface LineChartDataItem {
  name: string;
  [key: string]: string | number;
}

export interface LineChartSeries {
  dataKey: string;
  name?: string;
  color?: string;
  strokeWidth?: number;
}

export interface LineChartProps {
  data: LineChartDataItem[];
  series: LineChartSeries[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
  ariaLabel?: string;
}

const DEFAULT_COLORS = [
  '#007bff', // Primary blue
  '#28a745', // Success green
  '#ffc107', // Warning yellow
  '#dc3545', // Danger red
  '#6c757d', // Secondary gray
  '#17a2b8', // Info cyan
];

function LineChart({
  data,
  series,
  title,
  xAxisLabel,
  yAxisLabel,
  height = 300,
  showLegend = true,
  showGrid = true,
  showDots = true,
  ariaLabel,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="chart-empty"
        role="img"
        aria-label={ariaLabel || 'Empty line chart'}
      >
        <p>No data available</p>
      </div>
    );
  }

  if (!series || series.length === 0) {
    return (
      <div 
        className="chart-empty"
        role="img"
        aria-label={ariaLabel || 'Empty line chart'}
      >
        <p>No series configured</p>
      </div>
    );
  }

  return (
    <div className="chart-container" role="img" aria-label={ariaLabel || title || 'Line chart'}>
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
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
          />
          {showLegend && <Legend />}
          {series.map((s, index) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              stroke={s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              strokeWidth={s.strokeWidth || 2}
              dot={showDots}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineChart;
