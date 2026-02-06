import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  bookings_by_day?: Record<string, number>;
  revenue_by_day?: Record<string, number>;
  status_breakdown?: Record<string, number>;
  bookings_by_service?: Record<string, { count: number; revenue: number }>;
}

interface DashboardChartsProps {
  data: ChartData;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: false,
      },
    },
  };

  // Prepare bookings over time data
  const bookingsData = {
    labels: data.bookings_by_day ? Object.keys(data.bookings_by_day) : [],
    datasets: [
      {
        label: 'Bookings',
        data: data.bookings_by_day ? Object.values(data.bookings_by_day) : [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // Prepare revenue over time data
  const revenueData = {
    labels: data.revenue_by_day ? Object.keys(data.revenue_by_day) : [],
    datasets: [
      {
        label: 'Revenue ($)',
        data: data.revenue_by_day ? Object.values(data.revenue_by_day) : [],
        borderColor: 'rgb(244, 63, 94)',
        backgroundColor: 'rgba(244, 63, 94, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // Prepare status breakdown data
  const statusData = {
    labels: data.status_breakdown ? Object.keys(data.status_breakdown) : [],
    datasets: [
      {
        data: data.status_breakdown ? Object.values(data.status_breakdown) : [],
        backgroundColor: [
          '#10B981', // completed - green
          '#F59E0B', // pending - yellow
          '#EF4444', // cancelled - red
          '#6366F1', // confirmed - blue
          '#8B5CF6', // no_show - purple
        ],
        borderWidth: 0,
      },
    ],
  };

  // Prepare services data
  const servicesData = {
    labels: data.bookings_by_service ? Object.keys(data.bookings_by_service) : [],
    datasets: [
      {
        label: 'Bookings',
        data: data.bookings_by_service
          ? Object.values(data.bookings_by_service).map(service => service.count)
          : [],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(244, 63, 94, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="charts-grid">
      {/* Bookings Over Time Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Bookings Over Time</h3>
          <p className="chart-subtitle">Daily booking trends</p>
        </div>
        <div className="chart-container">
          <Line data={bookingsData} options={lineChartOptions} />
        </div>
      </div>

      {/* Revenue Over Time Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Revenue Over Time</h3>
          <p className="chart-subtitle">Daily revenue trends</p>
        </div>
        <div className="chart-container">
          <Line data={revenueData} options={lineChartOptions} />
        </div>
      </div>

      {/* Booking Status Distribution */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Booking Status Distribution</h3>
          <p className="chart-subtitle">Breakdown by status</p>
        </div>
        <div className="chart-container">
          <Doughnut data={statusData} options={doughnutOptions} />
        </div>
      </div>

      {/* Top Services Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Top Services</h3>
          <p className="chart-subtitle">Most popular services</p>
        </div>
        <div className="chart-container">
          <Bar data={servicesData} options={barChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
