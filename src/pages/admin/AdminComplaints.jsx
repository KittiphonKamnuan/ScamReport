import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceHistoryService } from '../../services/serviceHistoryService';

const AdminComplaints = () => {
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

  // เปิด modal แสดงรายละเอียด
  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  // ปิด modal
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedRecord(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ประวัติการดำเนินการ</h1>
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
          <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
            เพิ่มข้อมูล
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ลำดับ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">รหัสอ้างอิง</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-1">
                      วันที่
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-1">
                      จังหวัด
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">เดือน</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">รายละเอียดประเด็น</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ประเภทประเด็น</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">เพศ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">อายุ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ประโยชน์ที่ได้รับ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">อาชีพ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">สถานะของผู้ได้รับประโยชน์</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ชื่อชุมชน/หน่วยงาน</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">จำนวนผู้ได้รับประโยชน์</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ปี</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="16" className="px-4 py-12 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>ไม่พบข้อมูลที่ค้นหา</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {record.record_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {record.date ? new Date(record.date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{record.province || '-'}</td>
                      <td className="px-4 py-3 text-sm">{record.month_name || '-'}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" title={record.description}>
                        {record.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{record.issue_type || '-'}</td>
                      <td className="px-4 py-3 text-sm">{record.gender || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">{record.age || '-'}</td>
                      <td className="px-4 py-3 text-sm">{record.benefit_received || '-'}</td>
                      <td className="px-4 py-3 text-sm">{record.occupation || '-'}</td>
                      <td className="px-4 py-3 text-sm">{record.beneficiary_status || '-'}</td>
                      <td className="px-4 py-3 text-sm">{record.organization_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {record.is_representative ? record.beneficiary_count || 1 : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{record.year || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">
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
    </div>
  );
};

export default AdminComplaints;
