import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet,
  Image,
  Font
} from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register font if needed (you'll need to add the font files to your public folder)
// Font.register({
//   family: 'Roboto',
//   src: '/fonts/Roboto-Regular.ttf',
// });

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 5,
  },
  statsGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  logo: {
    width: 120,
    marginBottom: 10,
  },
  date: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 20,
  },
  chartImage: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'contain',
    marginBottom: 10,
    border: '1px solid #e2e8f0',
    borderRadius: 4,
  },
  table: {
    width: '100%',
    marginTop: 10,
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    textAlign: 'left',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    borderBottom: '1px solid #e2e8f0',
  },
  tableCell: {
    padding: 8,
    fontSize: 10,
    color: '#334155',
    borderBottom: '1px solid #e2e8f0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  col: {
    width: '48%',
  },
});

const StatisticsReport = ({ stats, chartImages = {} }) => {
  const currentDate = new Date();
  const formattedDate = format(currentDate, 'MMMM d, yyyy');
  const formattedTime = format(currentDate, 'h:mm a');

  // Function to render a simple table for data that would normally be a chart
  const renderDataTable = (labels, data) => (
    <View style={styles.chartContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Category</th>
            <th style={styles.tableHeader}>Count</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((label, index) => (
            <tr key={index}>
              <td style={styles.tableCell}>{label}</td>
              <td style={styles.tableCell}>{data[index]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </View>
  );

  // Function to render a table for time series data
  const renderTimeSeriesTable = (data) => {
    if (!data || !data.length) return null;
    
    const sortedData = [...data].sort((a, b) => {
      if (a._id.year !== b._id.year) return a._id.year - b._id.year;
      return a._id.month - b._id.month;
    });

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return (
      <View style={styles.chartContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Period</th>
              <th style={styles.tableHeader}>Report Count</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr key={index}>
                <td style={styles.tableCell}>
                  {`${monthNames[item._id.month - 1]} ${item._id.year}`}
                </td>
                <td style={styles.tableCell}>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AddisCare Statistics Report</Text>
          <Text style={styles.subtitle}>Comprehensive overview of hazard reports and analytics</Text>
          <Text style={styles.date}>
            Generated on {formattedDate} at {formattedTime}
          </Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.totalReports || 0}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.pendingReports || 0}</Text>
              <Text style={styles.statLabel}>Pending Resolution</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.resolvedReports || 0}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.escalatedReports || 0}</Text>
              <Text style={styles.statLabel}>Escalated</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            {/* Reports by Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reports by Status</Text>
              {stats?.statusCounts && renderDataTable(
                Object.keys(stats.statusCounts).map(key => 
                  key.replace('_', ' ').charAt(0).toUpperCase() + key.replace('_', ' ').slice(1)
                ),
                Object.values(stats.statusCounts)
              )}
            </View>
          </View>
          <View style={styles.col}>
            {/* Reports by Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reports by Category</Text>
              {stats?.categoryCounts && renderDataTable(
                Object.keys(stats.categoryCounts).map(key => 
                  key.replace('_', ' ').charAt(0).toUpperCase() + key.replace('_', ' ').slice(1)
                ),
                Object.values(stats.categoryCounts)
              )}
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            {/* Reports by Urgency */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reports by Urgency Level</Text>
              {stats?.urgencyLevels && renderDataTable(
                Object.keys(stats.urgencyLevels).map(key => 
                  key.charAt(0).toUpperCase() + key.slice(1) + ' Urgency'
                ),
                Object.values(stats.urgencyLevels)
              )}
            </View>
          </View>
          <View style={styles.col}>
            {/* Reports Over Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reports Over Time</Text>
              {stats?.reportsOverTime && renderTimeSeriesTable(stats.reportsOverTime)}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This report was generated by AddisCare - Comprehensive Hazard Reporting System</Text>
          <Text>Confidential - For official use only</Text>
        </View>
      </Page>
    </Document>
  );
};

export default StatisticsReport;
