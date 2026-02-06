// Dashboard export utilities
export const exportToPDF = (metrics: any, dateRange: string) => {
  // Create a simple HTML report
  const reportContent = `
    <html lang="en">
      <head>
        <title>Dashboard Report - ${dateRange}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .metric-card { padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #333; }
          .metric-title { font-size: 14px; color: #666; margin-bottom: 5px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Dashboard Report</h1>
          <p>${dateRange}</p>
        </div>
        
        <div class="metrics">
          <div class="metric-card">
            <div class="metric-title">Total Bookings</div>
            <div class="metric-value">${metrics.total_bookings}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Total Revenue</div>
            <div class="metric-value">$${metrics.total_revenue.toFixed(2)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Completed Bookings</div>
            <div class="metric-value">${metrics.completed_bookings}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Average Booking Value</div>
            <div class="metric-value">$${metrics.average_booking_value.toFixed(2)}</div>
          </div>
        </div>
        
        <h2>Staff Performance</h2>
        <table class="table">
          <tr>
            <th>Staff Member</th>
            <th>Bookings</th>
            <th>Revenue</th>
            <th>Avg. per Booking</th>
          </tr>
          ${metrics.staff_performance?.map((staff: any) => `
            <tr>
              <td>${staff.name}</td>
              <td>${staff.bookings}</td>
              <td>$${staff.revenue.toFixed(2)}</td>
              <td>$${staff.average_per_booking.toFixed(2)}</td>
            </tr>
          `).join('') || '<tr><td colspan="4">No staff data available</td></tr>'}
        </table>
      </body>
    </html>
  `;

  // Create and download PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(reportContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

export const exportToCSV = (metrics: any, dateRange: string) => {
  const csvData = [];

  // Add header
  csvData.push(['Dashboard Report', dateRange]);
  csvData.push([]);

  // Add metrics
  csvData.push(['Metrics']);
  csvData.push(['Metric', 'Value']);
  csvData.push(['Total Bookings', metrics.total_bookings]);
  csvData.push(['Total Revenue', `$${metrics.total_revenue.toFixed(2)}`]);
  csvData.push(['Completed Bookings', metrics.completed_bookings]);
  csvData.push(['Cancelled Bookings', metrics.cancelled_bookings]);
  csvData.push(['Pending Bookings', metrics.pending_bookings]);
  csvData.push(['Average Booking Value', `$${metrics.average_booking_value.toFixed(2)}`]);
  csvData.push(['Completion Rate', `${metrics.completion_rate.toFixed(1)}%`]);
  csvData.push([]);

  // Add staff performance
  if (metrics.staff_performance && metrics.staff_performance.length > 0) {
    csvData.push(['Staff Performance']);
    csvData.push(['Staff Member', 'Bookings', 'Revenue', 'Avg. per Booking']);
    metrics.staff_performance.forEach((staff: any) => {
      csvData.push([
        staff.name,
        staff.bookings,
        `$${staff.revenue.toFixed(2)}`,
        `$${staff.average_per_booking.toFixed(2)}`
      ]);
    });
  }

  // Convert to CSV string
  const csvContent = csvData.map(row =>
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
