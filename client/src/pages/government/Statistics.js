import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  ButtonGroup,
  Dropdown,
  Form,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { FiDownload, FiPrinter, FiFileText, FiImage, FiFilter, FiCalendar, FiCheckCircle, FiClock, FiAlertTriangle } from 'react-icons/fi';
import api from '../../utils/api';
import Spinner from '../../components/layout/Spinner';
import PrintStatistics from '../../components/reports/PrintStatistics';

// Create aliases for icons
const PrintIcon = FiPrinter;
const ResolvedIcon = FiCheckCircle;
const PendingIcon = FiClock;
const EscalatedIcon = FiAlertTriangle;

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const GovStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    urgency: ''
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Refs for charts to be captured for PDF
  const statusChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const timeSeriesChartRef = useRef(null);
  const urgencyChartRef = useRef(null);
  const reportRef = useRef(null);

  // Fetch statistics data
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        // Add date range and filters to the API call
        const params = new URLSearchParams();
        
        if (dateRange.startDate) params.append('startDate', dateRange.startDate);
        if (dateRange.endDate) params.append('endDate', dateRange.endDate);
        if (filters.category) params.append('category', filters.category);
        if (filters.status) params.append('status', filters.status);
        if (filters.urgency) params.append('urgency', filters.urgency);
        
        const queryString = params.toString();
        const url = queryString ? `/statistics?${queryString}` : '/statistics';
        
        const res = await api.get(url);
        setStats(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load statistics data');
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [dateRange, filters]);

  // Prepare data for status chart
  const prepareStatusData = () => {
    if (!stats || !stats.statusCounts) return { labels: [], datasets: [] };
    
    const labels = Object.keys(stats.statusCounts).map(key => 
      key.replace('_', ' ').charAt(0).toUpperCase() + key.replace('_', ' ').slice(1)
    );
    const data = Object.values(stats.statusCounts);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare data for category chart
  const prepareCategoryData = () => {
    if (!stats || !stats.categoryCounts) return { labels: [], datasets: [] };
    
    const labels = Object.keys(stats.categoryCounts).map(key => 
      key.replace('_', ' ').charAt(0).toUpperCase() + key.replace('_', ' ').slice(1)
    );
    const data = Object.values(stats.categoryCounts);
    
    return {
      labels,
      datasets: [
        {
          label: 'Reports by Category',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare data for time series chart
  const prepareTimeSeriesData = () => {
    if (!stats || !stats.reportsOverTime || !Array.isArray(stats.reportsOverTime)) {
      return { labels: [], datasets: [] };
    }
    
    try {
      // Filter out any invalid entries and ensure _id exists
      const validData = stats.reportsOverTime.filter(
        item => item && item._id && typeof item._id === 'object' && 
               item._id.year !== undefined && item._id.month !== undefined
      );
      
      if (validData.length === 0) return { labels: [], datasets: [] };
      
      // Sort by year and month
      const sortedData = [...validData].sort((a, b) => {
        const yearA = a?._id?.year || 0;
        const yearB = b?._id?.year || 0;
        const monthA = a?._id?.month || 0;
        const monthB = b?._id?.month || 0;
        
        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      });
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const labels = sortedData.map(item => {
        const month = item?._id?.month || 1;
        const year = item?._id?.year || new Date().getFullYear();
        return `${monthNames[Math.min(11, Math.max(0, month - 1))]} ${year}`;
      });
      
      const data = sortedData.map(item => item?.count || 0);
      
      return {
        labels,
        datasets: [
          {
            label: 'Reports Over Time',
            data,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1,
          },
        ],
      };
    } catch (error) {
      console.error('Error preparing time series data:', error);
      return { labels: [], datasets: [] };
    }
  };

  // Prepare data for urgency chart
  const prepareUrgencyData = () => {
    if (!stats || !stats.urgencyLevels) return { labels: [], datasets: [] };
    
    const labels = Object.keys(stats.urgencyLevels).map(key => 
      key.charAt(0).toUpperCase() + key.slice(1) + ' Urgency'
    );
    const data = Object.values(stats.urgencyLevels);
    
    return {
      labels,
      datasets: [
        {
          label: 'Reports by Urgency',
          data,
          backgroundColor: [
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(255, 99, 132, 0.7)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Function to download chart as image
  const downloadChartAsImage = async (chartRef, fileName) => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading chart:', error);
    }
  };

  // Function to generate PDF report
  const generatePdfReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Create a new PDF instance
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Add title
      pdf.setFontSize(20);
      pdf.text('AddisCare Statistics Report', 105, 20, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 30);
      
      // Add summary stats
      pdf.setFontSize(14);
      pdf.text('Summary Statistics', 15, 45);
      
      // Add summary table
      const summaryData = [
        ['Total Reports', stats?.totalReports || 0],
        ['Pending', stats?.pendingReports || 0],
        ['In Progress', stats?.inProgressReports || 0],
        ['Resolved', stats?.resolvedReports || 0],
        ['Escalated', stats?.escalatedReports || 0],
      ];
      
      // Use autoTable from jsPDF
      pdf.autoTable({
        startY: 50,
        head: [['Metric', 'Count']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      // Add status data
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text('Reports by Status', 15, 20);
      
      if (stats?.statusCounts) {
        const statusData = Object.entries(stats.statusCounts).map(([key, value]) => ({
          status: key.replace('_', ' ').charAt(0).toUpperCase() + key.replace('_', ' ').slice(1),
          count: value
        }));
        
        pdf.autoTable({
          startY: 30,
          head: [['Status', 'Count']],
          body: statusData.map(item => [item.status, item.count]),
          theme: 'grid',
        });
      }
      
      // Save the PDF
      pdf.save(`adiscare-statistics-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Function to export data as CSV
  const exportToCSV = () => {
    if (!stats) return;
    
    // Helper function to convert object to CSV rows
    const objectToCsv = (data) => {
      const csvRows = [];
      const headers = Object.keys(data[0]);
      csvRows.push(headers.join(','));
      
      for (const row of data) {
        const values = headers.map(header => {
          const escaped = ('' + row[header]).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      
      return csvRows.join('\n');
    };
    
    // Prepare data for CSV export
    const exportData = [];
    
    // Add summary data
    exportData.push({ type: 'Summary', metric: 'Total Reports', value: stats.totalReports || 0 });
    exportData.push({ type: 'Summary', metric: 'Pending Reports', value: stats.pendingReports || 0 });
    exportData.push({ type: 'Summary', metric: 'Resolved Reports', value: stats.resolvedReports || 0 });
    exportData.push({ type: 'Summary', metric: 'Escalated Reports', value: stats.escalatedReports || 0 });
    
    // Add status counts
    if (stats.statusCounts) {
      Object.entries(stats.statusCounts).forEach(([status, count]) => {
        exportData.push({
          type: 'Status',
          status: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1),
          count
        });
      });
    }
    
    // Add category counts
    if (stats.categoryCounts) {
      Object.entries(stats.categoryCounts).forEach(([category, count]) => {
        exportData.push({
          type: 'Category',
          category: category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1),
          count
        });
      });
    }
    
    // Add urgency levels
    if (stats.urgencyLevels) {
      Object.entries(stats.urgencyLevels).forEach(([level, count]) => {
        exportData.push({
          type: 'Urgency',
          level: level.charAt(0).toUpperCase() + level.slice(1),
          count
        });
      });
    }
    
    // Create CSV content
    const csvContent = objectToCsv(exportData);
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `adiscare-statistics-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Function to handle PDF download
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingReport(true);
      await generatePdfReport();
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Function to handle CSV download
  const handleDownloadCSV = () => {
    try {
      exportToCSV();
    } catch (err) {
      console.error('Error generating CSV:', err);
      setError('Failed to generate CSV report');
    }
  };

  // Function to handle print
  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    
    const printWindow = window.open('', '', 'width=1200,height=800');
    
    // Get the HTML content of the print component
    const printContent = printRef.current.outerHTML;
    
    // Create a complete HTML document with proper styles
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AddisCare - Statistics Report</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            @page {
              size: A4;
              margin: 1.5cm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .card {
              border: 1px solid #dee2e6 !important;
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 1rem;
            }
            .row {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .mb-4 {
              margin-bottom: 1.5rem !important;
            }
            .mt-4 {
              margin-top: 1.5rem !important;
            }
            .me-2 {
              margin-right: 0.5rem !important;
            }
            .text-center {
              text-align: center !important;
            }
            .text-muted {
              color: #6c757d !important;
            }
            .p-4 {
              padding: 1.5rem !important;
            }
            h1 {
              font-size: 2rem;
              margin-bottom: 1rem;
            }
            h2 {
              font-size: 1.5rem;
              margin-bottom: 0.5rem;
            }
            h4 {
              font-size: 1.25rem;
              margin-bottom: 1rem;
            }
            p {
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            // Auto-print when the window loads
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    // Write the document to the new window
    printWindow.document.open();
    printWindow.document.write(printDocument);
    printWindow.document.close();
  }, [printRef]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <Container>
        <div className="alert alert-danger">{error}</div>
      </Container>
    );
  }

  // Render loading state for report generation
  if (isGeneratingReport) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Generating report...</h5>
          <p className="text-muted">Please wait while we prepare your report.</p>
        </div>
      </div>
    );
  }

  return (
    <Container className="py-4" ref={reportRef}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Statistics & Analytics</h1>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="card-title d-flex align-items-center">
            <FiFilter className="me-2" /> Filters
          </h5>
          <Row>
            <Col md={4} className="mb-3">
              <Form.Label>Date Range</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control 
                  type="date" 
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                />
                <span className="align-self-center">to</span>
                <Form.Control 
                  type="date" 
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                />
              </div>
            </Col>
            <Col md={2} className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select 
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </Form.Select>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select 
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option value="">All Categories</option>
                <option value="road">Road</option>
                <option value="building">Building</option>
                <option value="environment">Environment</option>
                <option value="public_service">Public Service</option>
                <option value="other">Other</option>
              </Form.Select>
            </Col>
            <Col md={2} className="mb-3">
              <Form.Label>Urgency</Form.Label>
              <Form.Select 
                value={filters.urgency}
                onChange={(e) => setFilters({...filters, urgency: e.target.value})}
              >
                <option value="">All Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Form.Select>
            </Col>
            <Col md={1} className="d-flex align-items-end mb-3">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setDateRange({ startDate: '', endDate: '' });
                  setFilters({ category: '', status: '', urgency: '' });
                }}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Summary Cards */}
      <Row className="mb-4 g-4">
        {/* Total Reports Card */}
        <Col lg={3} md={6}>
          <Card className="stat-card h-100 border-0 shadow-sm overflow-hidden">
            <Card.Body className="position-relative">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h6 className="text-uppercase text-muted mb-1">Total Reports</h6>
                  <h2 className="mb-0">{stats?.totalReports || 0}</h2>
                </div>
                <div className="icon-shape bg-primary bg-opacity-10 text-primary rounded-circle p-3">
                  <FiFileText size={24} />
                </div>
              </div>
              <div className="mt-3">
                {stats?.categoryCounts && (
                  <div className="d-flex flex-wrap gap-2">
                    {Object.entries(stats.categoryCounts).map(([key, value]) => (
                      <span key={key} className="badge bg-light text-dark border">
                        {value} {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Resolved Card */}
        <Col lg={3} md={6}>
          <Card className="stat-card h-100 border-0 shadow-sm overflow-hidden">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h6 className="text-uppercase text-muted mb-1">Resolved</h6>
                  <h2 className="text-success mb-0">{stats?.statusCounts?.resolved || 0}</h2>
                </div>
                <div className="icon-shape bg-success bg-opacity-10 text-success rounded-circle p-3">
                  <ResolvedIcon size={24} />
                </div>
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Pending</span>
                  <span className="fw-medium">{stats?.statusCounts?.pending || 0}</span>
                </div>
                <div className="progress mb-2" style={{height: '4px'}}>
                  <div 
                    className="progress-bar bg-warning" 
                    role="progressbar" 
                    style={{width: `${(stats?.statusCounts?.pending / (stats?.totalReports || 1)) * 100}%`}}
                  ></div>
                </div>
                <div className="d-flex justify-content-between small text-muted">
                  <span>In Progress</span>
                  <span className="fw-medium">{stats?.statusCounts?.in_progress || 0}</span>
                </div>
                <div className="progress" style={{height: '4px'}}>
                  <div 
                    className="progress-bar bg-info" 
                    role="progressbar" 
                    style={{width: `${(stats?.statusCounts?.in_progress / (stats?.totalReports || 1)) * 100}%`}}
                  ></div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Pending Card */}
        <Col lg={3} md={6}>
          <Card className="stat-card h-100 border-0 shadow-sm overflow-hidden">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h6 className="text-uppercase text-muted mb-1">Pending</h6>
                  <h2 className="text-warning mb-0">{stats?.statusCounts?.pending || 0}</h2>
                </div>
                <div className="icon-shape bg-warning bg-opacity-10 text-warning rounded-circle p-3">
                  <PendingIcon size={24} />
                </div>
              </div>
              <div className="mt-3">
                <div className="d-flex align-items-center mb-2">
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between small text-muted">
                      <span>In Progress</span>
                      <span className="fw-medium">{stats?.statusCounts?.in_progress || 0}</span>
                    </div>
                    <div className="progress mt-1" style={{height: '6px'}}>
                      <div 
                        className="progress-bar bg-info" 
                        role="progressbar" 
                        style={{width: `${(stats?.statusCounts?.in_progress / (stats?.statusCounts?.pending || 1)) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between small text-muted">
                      <span>Avg. Resolution</span>
                      <span className="fw-medium">{stats?.avgResolutionTime?.toFixed(1) || 'N/A'} days</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Escalated/Rejected Card */}
        <Col lg={3} md={6}>
          <Card className="stat-card h-100 border-0 shadow-sm overflow-hidden">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="text-uppercase text-muted mb-1">Escalated</h6>
                  <h2 className="text-danger mb-0">{stats?.statusCounts?.escalated || 0}</h2>
                </div>
                <div className="icon-shape bg-danger bg-opacity-10 text-danger rounded-circle p-3">
                  <EscalatedIcon size={24} />
                </div>
              </div>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-muted">Rejected</span>
                    <span className="fw-medium">{stats?.statusCounts?.rejected || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted">
                    <span>Total Issues</span>
                    <span className="fw-medium">
                      {(stats?.statusCounts?.escalated || 0) + (stats?.statusCounts?.rejected || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add some custom styles */}
      <style jsx global>{`
        .stat-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1) !important;
        }
        .icon-shape {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
        }
        .progress {
          background-color: rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {/* Charts */}
      <Row className="mb-4 g-4">
        <Col lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">Reports by Status</Card.Title>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Download as image</Tooltip>}
                >
                  <Button 
                    variant="link" 
                    className="p-0 text-secondary"
                    onClick={() => downloadChartAsImage(statusChartRef, 'status-chart')}
                  >
                    <FiDownload size={16} />
                  </Button>
                </OverlayTrigger>
              </div>
              <div ref={statusChartRef} style={{ height: '300px' }}>
                <Pie 
                  data={prepareStatusData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">Reports by Category</Card.Title>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Download as image</Tooltip>}
                >
                  <Button 
                    variant="link" 
                    className="p-0 text-secondary"
                    onClick={() => downloadChartAsImage(categoryChartRef, 'category-chart')}
                  >
                    <FiDownload size={16} />
                  </Button>
                </OverlayTrigger>
              </div>
              <div ref={categoryChartRef} style={{ height: '300px' }}>
                <Bar 
                  data={prepareCategoryData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4 g-4">
        <Col lg={8}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="mb-0">Reports Over Time</Card.Title>
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Download as image</Tooltip>}
                >
                  <Button 
                    variant="link" 
                    className="p-0 text-secondary"
                    onClick={() => downloadChartAsImage(timeSeriesChartRef, 'timeseries-chart')}
                  >
                    <FiDownload size={16} />
                  </Button>
                </OverlayTrigger>
              </div>
              <div ref={timeSeriesChartRef} style={{ height: '300px' }}>
                <Line 
                  data={prepareTimeSeriesData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          title: function(context) {
                            return context[0].label;
                          },
                          label: function(context) {
                            return `Reports: ${context.raw}`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Print Component - Hidden until printed */}
      <div className="d-none">
        <PrintStatistics 
          ref={printRef}
          stats={stats}
          prepareStatusData={prepareStatusData}
          prepareCategoryData={prepareCategoryData}
          prepareTimeSeriesData={prepareTimeSeriesData}
          prepareUrgencyData={prepareUrgencyData}
        />
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .d-print-block,
          .d-print-block * {
            visibility: visible;
          }
          .d-print-block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
          .card {
            border: 1px solid #dee2e6 !important;
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 1rem;
          }
          .row {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
    </Container>
  );
};

export default GovStatistics;
