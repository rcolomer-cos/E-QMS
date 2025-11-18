import { BarChart, LineChart, DonutChart } from '../components/charts';
import type { 
  BarChartDataItem, 
  LineChartDataItem, 
  LineChartSeries,
  DonutChartDataItem 
} from '../components/charts';
import '../styles/Charts.css';

// Sample data for demonstrations
const barChartData: BarChartDataItem[] = [
  { name: 'Jan', value: 12 },
  { name: 'Feb', value: 19 },
  { name: 'Mar', value: 15 },
  { name: 'Apr', value: 25 },
  { name: 'May', value: 22 },
  { name: 'Jun', value: 30 },
];

const lineChartData: LineChartDataItem[] = [
  { name: 'Week 1', open: 10, closed: 8, inProgress: 5 },
  { name: 'Week 2', open: 15, closed: 12, inProgress: 7 },
  { name: 'Week 3', open: 12, closed: 14, inProgress: 6 },
  { name: 'Week 4', open: 18, closed: 16, inProgress: 9 },
  { name: 'Week 5', open: 14, closed: 18, inProgress: 8 },
  { name: 'Week 6', open: 20, closed: 22, inProgress: 10 },
];

const lineChartSeries: LineChartSeries[] = [
  { dataKey: 'open', name: 'Open', color: '#dc3545' },
  { dataKey: 'closed', name: 'Closed', color: '#28a745' },
  { dataKey: 'inProgress', name: 'In Progress', color: '#ffc107' },
];

const donutChartData: DonutChartDataItem[] = [
  { name: 'Critical', value: 8, color: '#dc3545' },
  { name: 'Major', value: 24, color: '#ffc107' },
  { name: 'Minor', value: 45, color: '#28a745' },
];

const donutChartData2: DonutChartDataItem[] = [
  { name: 'Manufacturing', value: 32 },
  { name: 'Quality Control', value: 18 },
  { name: 'Documentation', value: 12 },
  { name: 'Supplier', value: 8 },
  { name: 'Other', value: 7 },
];

function ChartDemo() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Chart Components Demo</h1>
      </div>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Bar Charts</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
          <BarChart
            data={barChartData}
            title="Monthly NCR Trends"
            xAxisLabel="Month"
            yAxisLabel="Number of NCRs"
            height={350}
            showGrid={true}
            ariaLabel="Bar chart showing monthly NCR trends from January to June"
          />
          
          <BarChart
            data={[
              { name: 'Critical', value: 8, color: '#dc3545' },
              { name: 'Major', value: 24, color: '#ffc107' },
              { name: 'Minor', value: 45, color: '#28a745' },
            ]}
            title="NCR by Severity"
            xAxisLabel="Severity Level"
            yAxisLabel="Count"
            height={350}
            showGrid={true}
            ariaLabel="Bar chart showing NCR distribution by severity"
          />
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Line Charts</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
          <LineChart
            data={lineChartData}
            series={lineChartSeries}
            title="NCR Status Trends"
            xAxisLabel="Time Period"
            yAxisLabel="Number of NCRs"
            height={350}
            showLegend={true}
            showGrid={true}
            showDots={true}
            ariaLabel="Line chart showing NCR status trends over 6 weeks"
          />

          <LineChart
            data={[
              { name: 'Q1', completed: 45, target: 50 },
              { name: 'Q2', completed: 52, target: 55 },
              { name: 'Q3', completed: 48, target: 60 },
              { name: 'Q4', completed: 65, target: 65 },
            ]}
            series={[
              { dataKey: 'completed', name: 'Completed', color: '#007bff' },
              { dataKey: 'target', name: 'Target', color: '#28a745', strokeWidth: 3 },
            ]}
            title="Quarterly Training Completion"
            xAxisLabel="Quarter"
            yAxisLabel="Employees"
            height={350}
            showLegend={true}
            ariaLabel="Line chart comparing quarterly training completion vs targets"
          />
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Donut Charts</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          <DonutChart
            data={donutChartData}
            title="NCR Distribution by Severity"
            height={350}
            showLegend={true}
            showPercentage={true}
            ariaLabel="Donut chart showing NCR distribution: Critical (8), Major (24), Minor (45)"
          />

          <DonutChart
            data={donutChartData2}
            title="NCR by Category"
            height={350}
            showLegend={true}
            showPercentage={true}
            ariaLabel="Donut chart showing NCR distribution by category"
          />

          <DonutChart
            data={[
              { name: 'Completed', value: 156, color: '#28a745' },
              { name: 'In Progress', value: 42, color: '#ffc107' },
              { name: 'Overdue', value: 12, color: '#dc3545' },
            ]}
            title="Training Status Overview"
            height={350}
            showLegend={true}
            showPercentage={true}
            innerRadius={70}
            outerRadius={110}
            ariaLabel="Donut chart showing training status distribution"
          />
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Empty State Handling</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          <BarChart
            data={[]}
            title="Bar Chart with No Data"
            ariaLabel="Empty bar chart"
          />

          <LineChart
            data={[]}
            series={[]}
            title="Line Chart with No Data"
            ariaLabel="Empty line chart"
          />

          <DonutChart
            data={[]}
            title="Donut Chart with No Data"
            ariaLabel="Empty donut chart"
          />
        </div>
      </section>
    </div>
  );
}

export default ChartDemo;
