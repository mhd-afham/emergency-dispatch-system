import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface ReportFilters {
  timePeriod: 'day' | 'week' | 'month' | 'year' | 'custom';
  customStartDate: string;
  customEndDate: string;
  sections: string[];
  status: string[];
  individualType: 'vehicle' | 'crew' | '';
  plateNumber: string;
  employeeId: string;
}

interface ReportData {
  generatedAt: Date;
  filters: any;
  data: {
    vehicles?: any[];
    crew?: any[];
    vehicleStats?: any;
    crewStats?: any;
    vehicleCount?: number;
    crewCount?: number;
  };
}

const ReportGenerationSection: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    timePeriod: 'month',
    customStartDate: '',
    customEndDate: '',
    sections: ['vehicle', 'crew'],
    status: ['approved', 'rejected'],
    individualType: '',
    plateNumber: '',
    employeeId: ''
  });

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  // Fetch summary statistics on mount
  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await apiClient.get('/reports/summary');
      setSummary(response.data.data);
    } catch (err: any) {
      console.error('Error fetching summary:', err);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setIsGenerated(false);
    setError('');
  };

  const handleCheckboxChange = (field: 'sections' | 'status', value: string) => {
    setFilters(prev => {
      const currentArray = prev[field];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
    setIsGenerated(false);
  };

  const validateFilters = (): boolean => {
    // Individual search validation
    if (filters.individualType) {
      if (filters.individualType === 'vehicle' && !filters.plateNumber.trim()) {
        setError('Please enter a plate number for individual vehicle search');
        return false;
      }
      if (filters.individualType === 'crew' && !filters.employeeId.trim()) {
        setError('Please enter an employee ID for individual crew search');
        return false;
      }
      return true;
    }

    // General report validation
    if (filters.sections.length === 0) {
      setError('Please select at least one section (Vehicle or Crew)');
      return false;
    }

    if (filters.status.length === 0) {
      setError('Please select at least one status (Approved or Rejected)');
      return false;
    }

    if (filters.timePeriod === 'custom') {
      if (!filters.customStartDate || !filters.customEndDate) {
        setError('Please select both start and end dates for custom range');
        return false;
      }
      if (new Date(filters.customStartDate) > new Date(filters.customEndDate)) {
        setError('Start date must be before end date');
        return false;
      }
    }

    return true;
  };

  const handleGenerateReport = async () => {
    setError('');
    
    if (!validateFilters()) {
      return;
    }

    setLoading(true);

    try {
      const payload = filters.individualType
        ? {
            plateNumber: filters.individualType === 'vehicle' ? filters.plateNumber : undefined,
            employeeId: filters.individualType === 'crew' ? filters.employeeId : undefined,
            sections: filters.individualType === 'vehicle' ? ['vehicle'] : ['crew'],
            status: ['approved', 'rejected', 'pending']
          }
        : {
            timePeriod: filters.timePeriod,
            customStartDate: filters.timePeriod === 'custom' ? filters.customStartDate : undefined,
            customEndDate: filters.timePeriod === 'custom' ? filters.customEndDate : undefined,
            sections: filters.sections,
            status: filters.status
          };

      console.log('🔍 Generating report with payload:', payload);
      console.log('🔍 API URL:', apiClient.defaults.baseURL);

      const response = await apiClient.post('/reports/generate', payload);
      
      console.log('✅ Report response:', response.data);
      
      setReportData(response.data.data);
      setIsGenerated(true);
      setError('');

      console.log('✅ Report generated successfully');
    } catch (err: any) {
      console.error('❌ Error generating report:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error message:', err.message);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate report';
      setError(errorMessage);
      setIsGenerated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 10;

    // Add Respondr logo to header
    try {
      // Use the PNG version of the logo for better PDF compatibility
      const logoPath = '/images/respondr-horizontal.png';
      const img = new Image();
      img.src = logoPath;
      
      // Add logo image (50x15 size for header)
      doc.addImage(img, 'PNG', 14, yPosition, 50, 15);
      yPosition += 16;
    } catch (error) {
      // Fallback: Use styled text if image fails to load
      console.warn('Logo not loaded, using text fallback');
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69); // Respondr Red
      doc.text('Respondr', 14, yPosition);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Emergency Dispatch System', 14, yPosition + 5);
      yPosition += 12;
    }

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Add horizontal line
    doc.setDrawColor(220, 53, 69); // Red line
    doc.setLineWidth(1);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 8;

    // Add header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Registration Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, 14, yPosition);
    
    yPosition += 7;
    const filterText = filters.individualType
      ? `Individual ${filters.individualType === 'vehicle' ? 'Vehicle' : 'Crew'} Report`
      : `Period: ${filters.timePeriod} | Sections: ${filters.sections.join(', ')} | Status: ${filters.status.join(', ')}`;
    doc.text(`Filters: ${filterText}`, 14, yPosition);
    
    yPosition += 10;

    // Add vehicle data
    if (reportData.data.vehicles && reportData.data.vehicles.length > 0) {
      // Check if this is an individual vehicle report
      const isIndividualVehicle = filters.individualType === 'vehicle' && reportData.data.vehicles.length === 1;
      
      if (isIndividualVehicle) {
        // Detailed individual vehicle report
        const vehicle = reportData.data.vehicles[0];
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 128, 185);
        doc.text('Individual Vehicle Details', 14, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 10;

        // Basic Information Section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Basic Information', 14, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const basicInfo = [
          ['Plate Number:', vehicle.registration?.plateNumber || 'N/A'],
          ['Vehicle Type:', vehicle.registration?.vehicleType || 'N/A'],
          ['Make:', vehicle.registration?.make || 'N/A'],
          ['Model:', vehicle.registration?.model || 'N/A'],
          ['Year:', vehicle.registration?.year?.toString() || 'N/A'],
          ['VIN:', vehicle.registration?.vin || 'N/A'],
          ['Color:', vehicle.registration?.color || 'N/A']
        ];

        basicInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, 20, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(value, 80, yPosition);
          yPosition += 6;
        });

        yPosition += 4;

        // Equipment Information Section
        if (vehicle.equipment && vehicle.equipment.items && vehicle.equipment.items.length > 0) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Equipment Inventory', 14, yPosition);
          yPosition += 7;

          const equipmentData = vehicle.equipment.items.map((item: any) => [
            item.name || 'N/A',
            item.type || 'N/A',
            item.serialNumber || 'N/A',
            item.quantity?.toString() || '1',
            item.status || 'N/A'
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Equipment Name', 'Type', 'Serial Number', 'Qty', 'Status']],
            body: equipmentData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 9 },
            margin: { left: 14, right: 14 }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Station Information
        if (vehicle.station) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Station Assignment', 14, yPosition);
          yPosition += 6;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Home Station: ${vehicle.station.name || vehicle.station.stationName || 'N/A'}`, 20, yPosition);
          yPosition += 10;
        }

        // Registration Status
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Registration Status', 14, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const statusInfo = [
          ['Status:', vehicle.registrationStatus?.status || 'N/A'],
          ['Submitted By:', vehicle.registrationStatus?.submittedBy?.name || 'N/A'],
          ['Submitted Date:', vehicle.registrationStatus?.submittedAt ? new Date(vehicle.registrationStatus.submittedAt).toLocaleString() : 'N/A'],
          ['Reviewed By:', vehicle.registrationStatus?.reviewedBy?.name || 'N/A'],
          ['Review Date:', vehicle.registrationStatus?.reviewedAt ? new Date(vehicle.registrationStatus.reviewedAt).toLocaleString() : 'N/A']
        ];

        if (vehicle.registrationStatus?.rejectionReason) {
          statusInfo.push(['Rejection Reason:', vehicle.registrationStatus.rejectionReason]);
        }

        statusInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, 20, yPosition);
          doc.setFont('helvetica', 'normal');
          const maxWidth = 120;
          const lines = doc.splitTextToSize(value, maxWidth);
          doc.text(lines, 80, yPosition);
          yPosition += (lines.length * 6);
        });

        yPosition += 4;

        // Audit Trail
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Audit Trail', 14, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Created: ${vehicle.audit?.createdAt ? new Date(vehicle.audit.createdAt).toLocaleString() : 'N/A'}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Last Updated: ${vehicle.audit?.updatedAt ? new Date(vehicle.audit.updatedAt).toLocaleString() : 'N/A'}`, 20, yPosition);
        yPosition += 6;
        if (vehicle.audit?.updatedBy?.name) {
          doc.text(`Updated By: ${vehicle.audit.updatedBy.name}`, 20, yPosition);
          yPosition += 6;
        }

      } else {
        // Summary table for multiple vehicles
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Vehicle Registrations', 14, yPosition);
        yPosition += 7;

        const vehicleTableData = reportData.data.vehicles.map(v => [
          v.registration.plateNumber,
          v.registration.vehicleType,
          v.registration.make + ' ' + v.registration.model,
          v.registration.year,
          v.registrationStatus?.status || 'N/A',
          new Date(v.audit.createdAt).toLocaleDateString()
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Plate', 'Type', 'Make/Model', 'Year', 'Status', 'Date']],
          body: vehicleTableData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Add vehicle statistics
        if (reportData.data.vehicleStats) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Vehicle Statistics:', 14, yPosition);
          yPosition += 7;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Total: ${reportData.data.vehicleStats.total}`, 14, yPosition);
          doc.text(`Approved: ${reportData.data.vehicleStats.approved}`, 70, yPosition);
          doc.text(`Rejected: ${reportData.data.vehicleStats.rejected}`, 126, yPosition);
          doc.text(`Pending: ${reportData.data.vehicleStats.pending}`, 182, yPosition);
          yPosition += 10;
        }
      }
    }

    // Add crew data (on new page if needed)
    if (reportData.data.crew && reportData.data.crew.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      // Check if this is an individual crew report
      const isIndividualCrew = filters.individualType === 'crew' && reportData.data.crew.length === 1;

      if (isIndividualCrew) {
        // Detailed individual crew report
        const crew = reportData.data.crew[0];

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 152, 219);
        doc.text('Individual Crew Member Details', 14, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 10;

        // Personal Information Section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Personal Information', 14, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const personalInfo = [
          ['Employee ID:', crew.personal?.employeeId || 'N/A'],
          ['Full Name:', `${crew.personal?.firstName || ''} ${crew.personal?.lastName || ''}`.trim() || 'N/A'],
          ['Email:', crew.personal?.email || 'N/A'],
          ['Phone:', crew.personal?.phone || 'N/A'],
          ['Date of Birth:', crew.personal?.dateOfBirth ? new Date(crew.personal.dateOfBirth).toLocaleDateString() : 'N/A'],
          ['Address:', crew.personal?.address || 'N/A']
        ];

        personalInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, 20, yPosition);
          doc.setFont('helvetica', 'normal');
          const maxWidth = 120;
          const lines = doc.splitTextToSize(value, maxWidth);
          doc.text(lines, 80, yPosition);
          yPosition += (lines.length * 6);
        });

        yPosition += 4;

        // Professional Information Section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Professional Information', 14, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const professionalInfo = [
          ['Role:', crew.professional?.role || 'N/A'],
          ['Certification Level:', crew.professional?.certificationLevel || 'N/A'],
          ['Hire Date:', crew.professional?.hireDate ? new Date(crew.professional.hireDate).toLocaleDateString() : 'N/A'],
          ['Years of Experience:', crew.professional?.yearsOfExperience?.toString() || 'N/A'],
          ['Specializations:', crew.professional?.specializations?.join(', ') || 'None']
        ];

        professionalInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, 20, yPosition);
          doc.setFont('helvetica', 'normal');
          const maxWidth = 120;
          const lines = doc.splitTextToSize(value, maxWidth);
          doc.text(lines, 80, yPosition);
          yPosition += (lines.length * 6);
        });

        yPosition += 6;

        // Certifications Section
        if (crew.professional?.certifications && crew.professional.certifications.length > 0) {
          if (yPosition > 240) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Certifications', 14, yPosition);
          yPosition += 7;

          const certificationData = crew.professional.certifications.map((cert: any) => [
            cert.type || 'N/A',
            cert.number || 'N/A',
            cert.issuedBy || 'N/A',
            cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'N/A',
            cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Type', 'Number', 'Issued By', 'Issue Date', 'Expiry Date']],
            body: certificationData,
            theme: 'striped',
            headStyles: { fillColor: [52, 152, 219] },
            styles: { fontSize: 9 },
            margin: { left: 14, right: 14 }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Emergency Contact Section
        if (crew.emergencyContact) {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Emergency Contact', 14, yPosition);
          yPosition += 6;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const emergencyInfo = [
            ['Name:', crew.emergencyContact.name || 'N/A'],
            ['Relationship:', crew.emergencyContact.relationship || 'N/A'],
            ['Phone:', crew.emergencyContact.phone || 'N/A'],
            ['Email:', crew.emergencyContact.email || 'N/A']
          ];

          emergencyInfo.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, 20, yPosition);
            doc.setFont('helvetica', 'normal');
            doc.text(value, 80, yPosition);
            yPosition += 6;
          });

          yPosition += 4;
        }

        // Registration Status
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Registration Status', 14, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const statusInfo = [
          ['Status:', crew.registrationStatus?.status || 'N/A'],
          ['Submitted By:', crew.registrationStatus?.submittedBy?.name || 'N/A'],
          ['Submitted Date:', crew.registrationStatus?.submittedAt ? new Date(crew.registrationStatus.submittedAt).toLocaleString() : 'N/A'],
          ['Reviewed By:', crew.registrationStatus?.reviewedBy?.name || 'N/A'],
          ['Review Date:', crew.registrationStatus?.reviewedAt ? new Date(crew.registrationStatus.reviewedAt).toLocaleString() : 'N/A']
        ];

        if (crew.registrationStatus?.rejectionReason) {
          statusInfo.push(['Rejection Reason:', crew.registrationStatus.rejectionReason]);
        }

        statusInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, 20, yPosition);
          doc.setFont('helvetica', 'normal');
          const maxWidth = 120;
          const lines = doc.splitTextToSize(value, maxWidth);
          doc.text(lines, 80, yPosition);
          yPosition += (lines.length * 6);
        });

        yPosition += 4;

        // Audit Trail
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Audit Trail', 14, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Created: ${crew.audit?.createdAt ? new Date(crew.audit.createdAt).toLocaleString() : 'N/A'}`, 20, yPosition);
        yPosition += 6;
        doc.text(`Last Updated: ${crew.audit?.updatedAt ? new Date(crew.audit.updatedAt).toLocaleString() : 'N/A'}`, 20, yPosition);
        yPosition += 6;
        if (crew.audit?.updatedBy?.name) {
          doc.text(`Updated By: ${crew.audit.updatedBy.name}`, 20, yPosition);
          yPosition += 6;
        }

      } else {
        // Summary table for multiple crew members
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Crew Registrations', 14, yPosition);
        yPosition += 7;

        const crewTableData = reportData.data.crew.map(c => [
          c.personal.employeeId,
          `${c.personal.firstName} ${c.personal.lastName}`,
          c.professional.role,
          c.professional.certificationLevel,
          c.registrationStatus?.status || 'N/A',
          new Date(c.audit.createdAt).toLocaleDateString()
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Employee ID', 'Name', 'Role', 'Level', 'Status', 'Date']],
          body: crewTableData,
          theme: 'grid',
          headStyles: { fillColor: [52, 152, 219] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;

        // Add crew statistics
        if (reportData.data.crewStats) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Crew Statistics:', 14, yPosition);
          yPosition += 7;

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Total: ${reportData.data.crewStats.total}`, 14, yPosition);
          doc.text(`Approved: ${reportData.data.crewStats.approved}`, 70, yPosition);
          doc.text(`Rejected: ${reportData.data.crewStats.rejected}`, 126, yPosition);
          doc.text(`Pending: ${reportData.data.crewStats.pending}`, 182, yPosition);
        }
      }
    }

    // Add footer to all pages
    const pageCount = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Add horizontal line at bottom
      doc.setDrawColor(220, 53, 69); // Red line matching brand
      doc.setLineWidth(0.5);
      doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
      
      // Add Respondr logo to footer - Left side
      try {
        const footerLogoPath = '/images/respondr-horizontal.png';
        const footerImg = new Image();
        footerImg.src = footerLogoPath;
        
        // Add small logo in footer (25x7.5 size)
        doc.addImage(footerImg, 'PNG', 14, pageHeight - 18, 25, 7.5);
      } catch (error) {
        // Fallback: Use text if logo fails
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 53, 69);
        doc.text('Respondr', 14, pageHeight - 14);
      }
      
      // Add subtitle - Left side (below logo)
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Emergency Dispatch System', 14, pageHeight - 9);
      
      // Add page number - Center
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 16,
        { align: 'center' }
      );
      
      // Add generation date - Right
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        pageWidth - 14,
        pageHeight - 16,
        { align: 'right' }
      );
    }

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Save PDF
    const filename = filters.individualType
      ? `${filters.individualType}_${filters.plateNumber || filters.employeeId}_report.pdf`
      : `registrations_report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(filename);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">📊 Report Generation</h2>
          <p className="text-gray-600">Generate and download registration reports with custom filters</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total Vehicles</p>
              <p className="text-2xl font-bold text-blue-600">{summary.vehicles.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total Crew</p>
              <p className="text-2xl font-bold text-green-600">{summary.crew.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total Approved</p>
              <p className="text-2xl font-bold text-emerald-600">{summary.overall.approved}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total Rejected</p>
              <p className="text-2xl font-bold text-red-600">{summary.overall.rejected}</p>
            </div>
          </div>
        )}

        {/* Filter Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Report Filters</h3>

          {/* Search Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Report Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reportType"
                  value="general"
                  checked={!filters.individualType}
                  onChange={() => handleFilterChange('individualType', '')}
                  className="mr-2"
                />
                <span className="text-gray-700">General Report</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reportType"
                  value="individual"
                  checked={filters.individualType === 'vehicle'}
                  onChange={() => handleFilterChange('individualType', 'vehicle')}
                  className="mr-2"
                />
                <span className="text-gray-700">Individual Vehicle</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reportType"
                  value="individual"
                  checked={filters.individualType === 'crew'}
                  onChange={() => handleFilterChange('individualType', 'crew')}
                  className="mr-2"
                />
                <span className="text-gray-700">Individual Crew</span>
              </label>
            </div>
          </div>

          {/* Individual Search Fields */}
          {filters.individualType && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              {filters.individualType === 'vehicle' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plate Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={filters.plateNumber}
                    onChange={(e) => handleFilterChange('plateNumber', e.target.value.toUpperCase())}
                    placeholder="e.g., CAB-1234"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={filters.employeeId}
                    onChange={(e) => handleFilterChange('employeeId', e.target.value.toUpperCase())}
                    placeholder="e.g., EMP123456"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          )}

          {/* General Report Filters */}
          {!filters.individualType && (
            <>
              {/* Time Period Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Time Period <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {['day', 'week', 'month', 'year', 'custom'].map((period) => (
                    <button
                      key={period}
                      onClick={() => handleFilterChange('timePeriod', period)}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        filters.timePeriod === period
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              {filters.timePeriod === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={filters.customStartDate}
                      onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={filters.customEndDate}
                      onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Sections Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sections <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.sections.includes('vehicle')}
                      onChange={() => handleCheckboxChange('sections', 'vehicle')}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Vehicles</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.sections.includes('crew')}
                      onChange={() => handleCheckboxChange('sections', 'crew')}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Crew</span>
                  </label>
                </div>
              </div>

              {/* Status Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes('approved')}
                      onChange={() => handleCheckboxChange('status', 'approved')}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Approved</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes('rejected')}
                      onChange={() => handleCheckboxChange('status', 'rejected')}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Rejected</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Generate/Download Button */}
          <div className="flex gap-4">
            <button
              onClick={isGenerated ? handleDownloadReport : handleGenerateReport}
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-md font-semibold text-white transition-colors ${
                isGenerated
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Generating...
                </span>
              ) : isGenerated ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Report
                </span>
              )}
            </button>

            {isGenerated && (
              <button
                onClick={() => {
                  setIsGenerated(false);
                  setReportData(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Report Preview */}
        {isGenerated && reportData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Report Preview</h3>
              <span className="text-sm text-gray-500">
                Generated: {new Date(reportData.generatedAt).toLocaleString()}
              </span>
            </div>

            {/* Vehicle Data Preview */}
            {reportData.data.vehicles && reportData.data.vehicles.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    🚛 Vehicle Registrations ({reportData.data.vehicleCount})
                  </h4>
                  {reportData.data.vehicleStats && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600 font-medium">
                        ✓ {reportData.data.vehicleStats.approved} Approved
                      </span>
                      <span className="text-red-600 font-medium">
                        ✗ {reportData.data.vehicleStats.rejected} Rejected
                      </span>
                      <span className="text-yellow-600 font-medium">
                        ⊙ {reportData.data.vehicleStats.pending} Pending
                      </span>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plate Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Make/Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.data.vehicles.map((vehicle, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {vehicle.registration.plateNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {vehicle.registration.vehicleType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {vehicle.registration.make} {vehicle.registration.model}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {vehicle.registration.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              vehicle.registrationStatus?.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : vehicle.registrationStatus?.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {vehicle.registrationStatus?.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(vehicle.audit.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Crew Data Preview */}
            {reportData.data.crew && reportData.data.crew.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    👥 Crew Registrations ({reportData.data.crewCount})
                  </h4>
                  {reportData.data.crewStats && (
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600 font-medium">
                        ✓ {reportData.data.crewStats.approved} Approved
                      </span>
                      <span className="text-red-600 font-medium">
                        ✗ {reportData.data.crewStats.rejected} Rejected
                      </span>
                      <span className="text-yellow-600 font-medium">
                        ⊙ {reportData.data.crewStats.pending} Pending
                      </span>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.data.crew.map((member, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.personal.employeeId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {member.personal.firstName} {member.personal.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {member.professional.role}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {member.professional.certificationLevel}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              member.registrationStatus?.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : member.registrationStatus?.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {member.registrationStatus?.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDate(member.audit.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No Data Message */}
            {(!reportData.data.vehicles || reportData.data.vehicles.length === 0) &&
             (!reportData.data.crew || reportData.data.crew.length === 0) && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No data found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No registrations match the selected filters.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGenerationSection;
