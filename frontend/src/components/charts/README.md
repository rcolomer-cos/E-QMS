# Chart Components

Reusable chart components for KPI visualization in the E-QMS application. Built with React, TypeScript, and Recharts.

## Components

### BarChart

A bar chart component for displaying categorical data.

**Props:**
- `data: BarChartDataItem[]` - Array of data items with name and value
- `title?: string` - Optional chart title
- `xAxisLabel?: string` - Label for X-axis
- `yAxisLabel?: string` - Label for Y-axis
- `height?: number` - Height in pixels (default: 300)
- `colors?: string[]` - Array of colors for bars (uses default palette if not provided)
- `showLegend?: boolean` - Show legend (default: false)
- `showGrid?: boolean` - Show grid lines (default: true)
- `ariaLabel?: string` - Accessibility label

**Example:**
```tsx
import { BarChart } from '../components/charts';

const data = [
  { name: 'Jan', value: 12 },
  { name: 'Feb', value: 19 },
  { name: 'Mar', value: 15 },
];

<BarChart
  data={data}
  title="Monthly NCR Trends"
  xAxisLabel="Month"
  yAxisLabel="Number of NCRs"
  height={350}
  ariaLabel="Bar chart showing monthly NCR trends"
/>
```

### LineChart

A line chart component for displaying trend data over time.

**Props:**
- `data: LineChartDataItem[]` - Array of data items
- `series: LineChartSeries[]` - Array of series configurations
- `title?: string` - Optional chart title
- `xAxisLabel?: string` - Label for X-axis
- `yAxisLabel?: string` - Label for Y-axis
- `height?: number` - Height in pixels (default: 300)
- `showLegend?: boolean` - Show legend (default: true)
- `showGrid?: boolean` - Show grid lines (default: true)
- `showDots?: boolean` - Show data point dots (default: true)
- `ariaLabel?: string` - Accessibility label

**Example:**
```tsx
import { LineChart } from '../components/charts';

const data = [
  { name: 'Week 1', open: 10, closed: 8 },
  { name: 'Week 2', open: 15, closed: 12 },
];

const series = [
  { dataKey: 'open', name: 'Open', color: '#dc3545' },
  { dataKey: 'closed', name: 'Closed', color: '#28a745' },
];

<LineChart
  data={data}
  series={series}
  title="NCR Status Trends"
  xAxisLabel="Time Period"
  yAxisLabel="Number of NCRs"
  height={350}
  ariaLabel="Line chart showing NCR status trends"
/>
```

### DonutChart

A donut (pie) chart component for displaying proportional data.

**Props:**
- `data: DonutChartDataItem[]` - Array of data items with name and value
- `title?: string` - Optional chart title
- `height?: number` - Height in pixels (default: 300)
- `colors?: string[]` - Array of colors for segments (uses default palette if not provided)
- `showLegend?: boolean` - Show legend (default: true)
- `showPercentage?: boolean` - Display percentages on segments (default: true)
- `innerRadius?: number` - Inner radius in pixels (default: 60)
- `outerRadius?: number` - Outer radius in pixels (default: 100)
- `ariaLabel?: string` - Accessibility label

**Example:**
```tsx
import { DonutChart } from '../components/charts';

const data = [
  { name: 'Critical', value: 8, color: '#dc3545' },
  { name: 'Major', value: 24, color: '#ffc107' },
  { name: 'Minor', value: 45, color: '#28a745' },
];

<DonutChart
  data={data}
  title="NCR Distribution by Severity"
  height={350}
  showPercentage={true}
  ariaLabel="Donut chart showing NCR distribution by severity"
/>
```

## Features

### Responsive Design
All charts use `ResponsiveContainer` from Recharts, making them automatically responsive to container width changes. They adapt to different screen sizes including mobile devices.

### Accessibility
- Each chart includes ARIA labels for screen readers
- Charts are marked with `role="img"` 
- Empty states provide clear messaging
- High contrast mode support via CSS
- Keyboard navigation support (built into Recharts)

### Empty State Handling
All components gracefully handle empty data arrays by displaying a user-friendly empty state message.

### Customization
Charts support extensive customization through props:
- Custom colors per data item or using color palettes
- Configurable dimensions (height, inner/outer radius)
- Optional grid lines, legends, and data point dots
- Custom axis labels
- Tooltips with formatted data

## Styling

The components use the `Charts.css` stylesheet which includes:
- Consistent card-style containers with shadows
- Responsive breakpoints for mobile devices
- Print-friendly styles
- High contrast mode support
- Empty state styling

Import the stylesheet in your page:
```tsx
import '../styles/Charts.css';
```

## Demo

A comprehensive demo page is available at `/chart-demo` showcasing all chart types with various configurations and data sets.

## Dependencies

- React 18.2+
- TypeScript 5.3+
- Recharts 2.10+

## Browser Support

All modern browsers including:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
