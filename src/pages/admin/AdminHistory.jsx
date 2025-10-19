import React, { useState } from 'react';

const AdminHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - รอ API
  const mockHistory = [
    {
      id: 1,
      date: '2024-01-15 14:30',
      user: 'admin@thaipbs.or.th',
      action: 'อัพเดทสถานะเคส',
      target: 'เคส #1234',
      description: 'เปลี่ยนสถานะจาก "รอดำเนินการ" เป็น "กำลังดำเนินการ"'
    },
    {
      id: 2,
      date: '2024-01-15 13:15',
      user: 'journalist@thaipbs.or.th',
      action: 'เพิ่มความคิดเห็น',
      target: 'เคส #1233',
      description: 'เพิ่มบันทึกการสืบค้นข้อมูล'
    },
    {
      id: 3,
      date: '2024-01-15 11:45',
      user: 'admin@thaipbs.or.th',
      action: 'สร้างเคสใหม่',
      target: 'เคส #1235',
      description: 'สร้างเคสร้องเรียนจาก LINE OA'
    },
    {
      id: 4,
      date: '2024-01-14 16:20',
      user: 'admin@thaipbs.or.th',
      action: 'ลบเคส',
      target: 'เคส #1200',
      description: 'ลบเคสที่ซ้ำซ้อน'
    },
    {
      id: 5,
      date: '2024-01-14 10:30',
      user: 'journalist@thaipbs.or.th',
      action: 'ส่งออกรายงาน',
      target: 'รายงานประจำเดือน',
      description: 'ส่งออกรายงานสถิติเดือนมกราคม'
    }
  ];

  const filteredHistory = mockHistory.filter(item => 
    item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ประวัติการใช้งานระบบ</h1>
            <p className="text-sm text-gray-600 mt-1">ติดตามการเปลี่ยนแปลงและกิจกรรมในระบบ</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              ส่งออกข้อมูล
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาประวัติการใช้งาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* History Timeline */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">ไม่พบประวัติที่ค้นหา</p>
            </div>
          ) : (
            filteredHistory.map((item, index) => (
              <div key={item.id} className="relative pl-8 pb-8 last:pb-0">
                {/* Timeline line */}
                {index !== filteredHistory.length - 1 && (
                  <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                )}
                
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5">
                  <div className="w-6 h-6 rounded-full bg-orange-500 border-4 border-white shadow-md"></div>
                </div>

                {/* Content */}
                <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.action}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.target}</p>
                    </div>
                    <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                      {item.date}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {item.user}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-900">หน่วยความจำ</h4>
            <p className="text-sm text-blue-700 mt-1">
              ระบบจะเก็บประวัติการใช้งานไว้ 90 วัน หากต้องการข้อมูลย้อนหลังเพิ่มเติม กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHistory;