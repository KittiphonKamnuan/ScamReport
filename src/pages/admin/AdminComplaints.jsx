import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceHistoryService } from '../../services/serviceHistoryService';
import * as XLSX from 'xlsx';

const AdminComplaints = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    province: '',
    issue_type: '',
    status: '',
    gender: '',
    year: ''
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [formData, setFormData] = useState({
    date: '',
    province: '',
    month_name: '',
    description: '',
    issue_type: '',
    gender: '',
    age: '',
    benefit_received: '',
    occupation: '',
    beneficiary_status: '',
    organization_name: '',
    beneficiary_count: '',
    year: new Date().getFullYear(),
    financial_damage: '',
    status: 'รับเรื่อง',
    recorded_by: '',
    is_representative: false
  });

  // ✨ React Query: Auto-caching service history list
  const {
    data: serviceHistory = [],
    isLoading: loading,
    error,
    refetch: loadServiceHistory
  } = useQuery({
    queryKey: ['service-history'],
    queryFn: async () => {
      const data = await serviceHistoryService.getServiceHistory({ limit: 1000 });
      return data && data.length > 0 ? data : [];
    },
    staleTime: 30000,  // 30 seconds
    cacheTime: 300000, // 5 minutes
  });

  // ✨ React Query Mutation: Create service history
  const createMutation = useMutation({
    mutationFn: (data) => serviceHistoryService.createServiceHistory(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['service-history']);
      handleCloseAddModal();
      alert('✅ เพิ่มข้อมูลสำเร็จ');
    },
    onError: (error) => {
      console.error('Error creating service history:', error);
      alert('❌ เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
    }
  });

  // เปิด modal แสดงรายละเอียด
  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  // ปิด modal รายละเอียด
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedRecord(null);
  };

  // เปิด modal เพิ่มข้อมูล
  const handleOpenAddModal = () => {
    setShowAddModal(true);
  };

  // ปิด modal เพิ่มข้อมูล
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormData({
      date: '',
      province: '',
      month_name: '',
      description: '',
      issue_type: '',
      gender: '',
      age: '',
      benefit_received: '',
      occupation: '',
      beneficiary_status: '',
      organization_name: '',
      beneficiary_count: '',
      year: new Date().getFullYear(),
      financial_damage: '',
      status: 'รับเรื่อง',
      recorded_by: '',
      is_representative: false
    });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.date || !formData.description) {
      alert('⚠️ กรุณากรอกวันที่และรายละเอียดประเด็น');
      return;
    }

    // Prepare data
    const submitData = {
      ...formData,
      age: formData.age ? parseInt(formData.age) : null,
      beneficiary_count: formData.beneficiary_count ? parseInt(formData.beneficiary_count) : null,
      financial_damage: formData.financial_damage ? parseFloat(formData.financial_damage) : null,
      year: parseInt(formData.year)
    };

    createMutation.mutate(submitData);
  };

  // Handle Excel upload button click
  const handleExcelUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Download Excel template
  const handleDownloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        'วันที่': '2024-01-15',
        'จังหวัด': 'กรุงเทพมหานคร',
        'เดือน': 'มกราคม',
        'รายละเอียด': 'ตัวอย่างรายละเอียดประเด็น',
        'ประเภทประเด็น': 'การฉ้อโกง',
        'เพศ': 'ชาย',
        'อายุ': 35,
        'ประโยชน์ที่ได้รับ': 'รับคำปรึกษา',
        'อาชีพ': 'พนักงานบริษัท',
        'สถานะผู้รับประโยชน์': 'เจ้าของกิจการ',
        'ชื่อองค์กร': '',
        'จำนวนผู้รับประโยชน์': '',
        'ปี': 2024,
        'ความเสียหาย': 50000,
        'สถานะ': 'รับเรื่อง',
        'บันทึกโดย': 'Admin',
        'เป็นตัวแทน': 'ไม่'
      }
    ];

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // Set column widths
    const colWidths = [
      { wch: 12 }, // วันที่
      { wch: 20 }, // จังหวัด
      { wch: 12 }, // เดือน
      { wch: 40 }, // รายละเอียด
      { wch: 18 }, // ประเภทประเด็น
      { wch: 10 }, // เพศ
      { wch: 8 },  // อายุ
      { wch: 20 }, // ประโยชน์ที่ได้รับ
      { wch: 18 }, // อาชีพ
      { wch: 22 }, // สถานะผู้รับประโยชน์
      { wch: 25 }, // ชื่อองค์กร
      { wch: 18 }, // จำนวนผู้รับประโยชน์
      { wch: 8 },  // ปี
      { wch: 15 }, // ความเสียหาย
      { wch: 15 }, // สถานะ
      { wch: 15 }, // บันทึกโดย
      { wch: 12 }  // เป็นตัวแทน
    ];
    ws['!cols'] = colWidths;

    // Download file
    XLSX.writeFile(wb, 'Service_History_Template.xlsx');
  };

  // Handle Excel file upload
  const handleExcelFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('⚠️ กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: 0 });

    try {
      // Read file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('📊 Excel data parsed:', jsonData);

      if (jsonData.length === 0) {
        alert('⚠️ ไม่พบข้อมูลในไฟล์ Excel');
        setIsUploading(false);
        return;
      }

      // Validate and transform data
      const records = jsonData.map((row, index) => {
        // Map Excel columns to database fields
        // Support both Thai and English column names

        // Convert Excel date serial number to date string
        let dateValue = row['วันที่ให้บริการ'] || row['วันที่'] || row['date'];
        if (typeof dateValue === 'number') {
          // Excel date serial to JS date
          const excelEpoch = new Date(1899, 11, 30);
          const jsDate = new Date(excelEpoch.getTime() + dateValue * 86400000);
          dateValue = jsDate.toISOString().split('T')[0];
        }

        // Check if representative
        const beneficiaryCount = row['กรณีเป็นตัวแทน\nระบุจำนวนผู้ที่ได้รับประโยชน์ร่วมกัน'] ||
                                 row['จำนวนผู้รับประโยชน์'] ||
                                 row['beneficiary_count'] ||
                                 1;
        const isRepresentative = beneficiaryCount && parseInt(beneficiaryCount) > 1;

        return {
          date: dateValue,
          province: row['จังหวัด'] || row['province'] || '',
          month_name: row['เดือน'] || row['month_name'] || '',
          description: row['รายละเอียดประเด็น'] || row['รายละเอียด'] || row['description'] || '',
          issue_type: row['ประเภทประเด็น'] || row['issue_type'] || '',
          gender: row['เพศ'] || row['gender'] || '',
          age: row['อายุ'] || row['age'] || null,
          benefit_received: row['ประโยชน์ที่ได้รับ'] || row['benefit_received'] || '',
          occupation: row['อาชีีพ'] || row['อาชีพ'] || row['occupation'] || '',
          beneficiary_status: row['สถานะของผู้ได้รับประโยชน์'] || row['สถานะผู้รับประโยชน์'] || row['beneficiary_status'] || '',
          organization_name: row['ชื่อองค์กร'] || row['organization_name'] || '',
          beneficiary_count: parseInt(beneficiaryCount) || 1,
          year: row['ปี'] || row['year'] || new Date().getFullYear(),
          financial_damage: row['ความเสียหาย'] || row['financial_damage'] || null,
          status: row['สถานะ'] || row['status'] || 'รับเรื่อง',
          recorded_by: row['บันทึกโดย'] || row['recorded_by'] || '',
          is_representative: isRepresentative
        };
      });

      // Filter out invalid records (must have date and description)
      const validRecords = records.filter(r => r.date && r.description);

      if (validRecords.length === 0) {
        alert('⚠️ ไม่พบข้อมูลที่ถูกต้อง (ต้องมีวันที่และรายละเอียด)');
        setIsUploading(false);
        return;
      }

      console.log(`✅ Valid records: ${validRecords.length} / ${records.length}`);

      // Upload records one by one
      setUploadProgress({ current: 0, total: validRecords.length });
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < validRecords.length; i++) {
        try {
          await serviceHistoryService.createServiceHistory(validRecords[i]);
          successCount++;
        } catch (error) {
          console.error(`Failed to upload record ${i + 1}:`, error);
          failCount++;
        }
        setUploadProgress({ current: i + 1, total: validRecords.length });
      }

      // Refresh list
      queryClient.invalidateQueries(['service-history']);

      // Show result
      alert(`✅ อัปโหลดเสร็จสิ้น!\n- สำเร็จ: ${successCount} รายการ\n- ล้มเหลว: ${failCount} รายการ`);

    } catch (error) {
      console.error('Error uploading Excel:', error);
      alert('❌ เกิดข้อผิดพลาดในการอัปโหลดไฟล์ Excel');
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filter data
  const filteredRecords = serviceHistory.filter(record => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      (record.description?.toLowerCase() || '').includes(search) ||
      (record.province?.toLowerCase() || '').includes(search) ||
      (record.issue_type?.toLowerCase() || '').includes(search) ||
      (record.record_number?.toLowerCase() || '').includes(search);

    const matchProvince = !filters.province || record.province === filters.province;
    const matchIssueType = !filters.issue_type || record.issue_type === filters.issue_type;
    const matchStatus = !filters.status || record.status === filters.status;
    const matchGender = !filters.gender || record.gender === filters.gender;
    const matchYear = !filters.year || record.year === parseInt(filters.year);

    return matchSearch && matchProvince && matchIssueType && matchStatus && matchGender && matchYear;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ประวัติดำเนินการ</h1>
        <p className="text-sm text-gray-600">
          จำนวน {loading ? '...' : `${filteredRecords.length} รายการ`}
          {filteredRecords.length !== serviceHistory.length && (
            <span className="text-gray-400"> (จากทั้งหมด {serviceHistory.length} รายการ)</span>
          )}
        </p>

        {/* Search Bar */}
        <div className="mt-4 flex items-center gap-3">
          {/* กล่องช่องค้นหา */}
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหา (รหัส, รายละเอียด, จังหวัด...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[400px] px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* ปุ่มเพิ่มข้อมูล */}
          <button
            onClick={handleOpenAddModal}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            เพิ่มข้อมูล
          </button>

          {/* ปุ่มอัปโหลด Excel */}
          <button
            onClick={handleExcelUploadClick}
            disabled={isUploading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลด Excel'}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full w-max">
              <thead className="bg-orange-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">ลำดับ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">รหัสอ้างอิง</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">วันที่</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">จังหวัด</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">รายละเอียดประเด็น</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">ประเภทประเด็น</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">เพศ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">อายุ</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>ไม่พบข้อมูลที่ค้นหา</p>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record, index) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{startIndex + index + 1}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {record.record_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {record.date ? new Date(record.date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap max-w-[120px] truncate" title={record.province}>
                        {record.province || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[250px] truncate" title={record.description}>
                        {record.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap max-w-[150px] truncate" title={record.issue_type}>
                        {record.issue_type || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-center">{record.gender || '-'}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-center">{record.age || '-'}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetail(record)}
                          className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredRecords.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              แสดง {startIndex + 1} ถึง {Math.min(endIndex, filteredRecords.length)} จาก {filteredRecords.length} รายการ
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← ก่อนหน้า
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return page === 1 ||
                           page === totalPages ||
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, arr) => {
                    // Add ellipsis if there's a gap
                    const prevPage = arr[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            currentPage === page
                              ? 'bg-orange-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-orange-500 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">รายละเอียดประวัติการดำเนินการ</h2>
                <p className="text-sm opacity-90 mt-1 font-mono">
                  {selectedRecord.record_number}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white hover:bg-orange-600 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">รหัสอ้างอิง</p>
                      <p className="font-mono font-semibold text-gray-900">{selectedRecord.record_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">วันที่</p>
                      <p className="font-semibold text-gray-900">
                        {selectedRecord.date ? new Date(selectedRecord.date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">จังหวัด</p>
                      <p className="font-semibold text-gray-900">{selectedRecord.province || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">ประเภทประเด็น</p>
                      <p className="font-semibold text-gray-900">{selectedRecord.issue_type || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600 mb-1">รายละเอียด</p>
                      <p className="text-gray-900">{selectedRecord.description}</p>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">ข้อมูลผู้รับบริการ</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">เพศ</p>
                      <p className="font-semibold text-gray-900">{selectedRecord.gender || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">อายุ</p>
                      <p className="font-semibold text-gray-900">{selectedRecord.age || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">อาชีพ</p>
                      <p className="font-semibold text-gray-900">{selectedRecord.occupation || '-'}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs text-gray-600 mb-1">ความเสียหายทางการเงิน</p>
                      <p className="font-semibold text-red-600">
                        {selectedRecord.financial_damage
                          ? `${parseFloat(selectedRecord.financial_damage).toLocaleString('th-TH')} บาท`
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">ประโยชน์และผลลัพธ์</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">ประโยชน์ที่ได้รับ</p>
                      <p className="font-semibold text-gray-900">{selectedRecord.benefit_received || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">สถานะของผู้ได้รับประโยชน์</p>
                      <p className="font-semibold text-gray-900">{selectedRecord.beneficiary_status || '-'}</p>
                    </div>
                    {selectedRecord.is_representative && (
                      <>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">ชื่อชุมชน/หน่วยงาน</p>
                          <p className="font-semibold text-gray-900">{selectedRecord.organization_name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">จำนวนผู้ได้รับประโยชน์</p>
                          <p className="font-semibold text-gray-900">{selectedRecord.beneficiary_count || 1} คน</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold">บันทึกโดย:</span> {selectedRecord.recorded_by || '-'}
                    </div>
                    <div>
                      <span className="font-semibold">สถานะ:</span> {selectedRecord.status || '-'}
                    </div>
                    <div>
                      <span className="font-semibold">สร้างเมื่อ:</span>{' '}
                      {selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString('th-TH') : '-'}
                    </div>
                    <div>
                      <span className="font-semibold">แก้ไขล่าสุด:</span>{' '}
                      {selectedRecord.updated_at ? new Date(selectedRecord.updated_at).toLocaleString('th-TH') : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ปิด
              </button>
              <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                แก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-orange-500 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">เพิ่มข้อมูลประวัติการดำเนินการ</h2>
                <p className="text-sm opacity-90 mt-1">กรุณากรอกข้อมูลให้ครบถ้วน</p>
              </div>
              <button
                onClick={handleCloseAddModal}
                className="text-white hover:bg-orange-600 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* ข้อมูลพื้นฐาน */}
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        วันที่ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">จังหวัด</label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        placeholder="เช่น กระบี่, กรุงเทพมหานคร"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">เดือน</label>
                      <input
                        type="text"
                        name="month_name"
                        value={formData.month_name}
                        onChange={handleInputChange}
                        placeholder="เช่น มกราคม, กุมภาพันธ์"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ปี</label>
                      <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        min="2000"
                        max="2100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทประเด็น</label>
                      <select
                        name="issue_type"
                        value={formData.issue_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      >
                        <option value="">-- เลือกประเภท --</option>
                        <option value="การฉ้อโกง">การฉ้อโกง</option>
                        <option value="การหลอกลวง">การหลอกลวง</option>
                        <option value="การคุกคาม">การคุกคาม</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">สถานะ</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      >
                        <option value="รับเรื่อง">รับเรื่อง</option>
                        <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                        <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                        <option value="ระงับ">ระงับ</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        รายละเอียดประเด็น <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows="3"
                        placeholder="อธิบายรายละเอียดประเด็นที่เกิดขึ้น..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ข้อมูลผู้รับบริการ */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">ข้อมูลผู้รับบริการ</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">เพศ</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      >
                        <option value="">-- เลือกเพศ --</option>
                        <option value="ชาย">ชาย</option>
                        <option value="หญิง">หญิง</option>
                        <option value="อื่นๆ">อื่นๆ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">อายุ</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        min="0"
                        max="150"
                        placeholder="ระบุอายุ"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">อาชีพ</label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleInputChange}
                        placeholder="เช่น เกษตรกร, พนักงานบริษัท"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ความเสียหายทางการเงิน (บาท)</label>
                      <input
                        type="number"
                        name="financial_damage"
                        value={formData.financial_damage}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="จำนวนเงินที่เสียหาย"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ประโยชน์และผลลัพธ์ */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">ประโยชน์และผลลัพธ์</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ประโยชน์ที่ได้รับ</label>
                      <input
                        type="text"
                        name="benefit_received"
                        value={formData.benefit_received}
                        onChange={handleInputChange}
                        placeholder="ระบุประโยชน์ที่ได้รับ"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">สถานะของผู้ได้รับประโยชน์</label>
                      <input
                        type="text"
                        name="beneficiary_status"
                        value={formData.beneficiary_status}
                        onChange={handleInputChange}
                        placeholder="เช่น เจ้าของกิจการ, พนักงาน"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="is_representative"
                          checked={formData.is_representative}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm font-semibold text-gray-700">เป็นตัวแทนของกลุ่ม/องค์กร</span>
                      </label>
                    </div>
                    {formData.is_representative && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อชุมชน/หน่วยงาน</label>
                          <input
                            type="text"
                            name="organization_name"
                            value={formData.organization_name}
                            onChange={handleInputChange}
                            placeholder="ชื่อชุมชนหรือหน่วยงาน"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">จำนวนผู้ได้รับประโยชน์</label>
                          <input
                            type="number"
                            name="beneficiary_count"
                            value={formData.beneficiary_count}
                            onChange={handleInputChange}
                            min="1"
                            placeholder="จำนวนคน"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ข้อมูลเพิ่มเติม */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">ข้อมูลเพิ่มเติม</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">บันทึกโดย</label>
                    <input
                      type="text"
                      name="recorded_by"
                      value={formData.recorded_by}
                      onChange={handleInputChange}
                      placeholder="ชื่อผู้บันทึกข้อมูล"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCloseAddModal}
                disabled={createMutation.isLoading}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={createMutation.isLoading}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {createMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึกข้อมูล'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Modal */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">กำลังอัปโหลดข้อมูล</h3>
              <p className="text-sm text-gray-600 mb-4">
                กรุณารอสักครู่... กำลังบันทึกข้อมูลลงในระบบ
              </p>

              {uploadProgress.total > 0 && (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>ความคืบหน้า</span>
                      <span className="font-semibold">
                        {uploadProgress.current} / {uploadProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${(uploadProgress.current / uploadProgress.total) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {Math.round((uploadProgress.current / uploadProgress.total) * 100)}% เสร็จสิ้น
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
