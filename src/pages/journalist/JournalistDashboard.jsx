import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

const JournalistDashboard = () => {
  const { user } = useAuth();
  const [stats] = useState({
    total: 156,
    readyForNews: 45,
    highPriority: 12,
    thisMonth: 88
  });

  const [recentComplaints] = useState([
    {
      id: 1,
      title: 'การฉ้อโกงลงทุนออนไลน์',
      category: 'fraud',
      priority: 'high',
      amount: '500,000',
      date: '2025-10-02',
      status: 'verified'
    },
    {
      id: 2,
      title: 'หลอกขายสินค้าออนไลน์ไม่ส่งของ',
      category: 'fraud',
      priority: 'medium',
      amount: '15,000',
      date: '2025-10-01',
      status: 'verified'
    },
    {
      id: 3,
      title: 'แอบอ้างเป็นเจ้าหน้าที่ธนาคาร',
      category: 'fraud',
      priority: 'high',
      amount: '200,000',
      date: '2025-10-01',
      status: 'verified'
    }
  ]);

  const getCategoryBadge = (category) => {
    const styles = {
      fraud: 'bg-red-100 text-red-700',
      legal: 'bg-blue-100 text-blue-700',
      tip: 'bg-green-100 text-green-700'
    };
    const labels = {
      fraud: 'ฉ้อโกง',
      legal: 'กฎหมาย',
      tip: 'เบาะแส'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[category]}`}>
        {labels[category]}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-700'
    };
    const labels = {
      high: 'เร่งด่วน',
      medium: 'ปานกลาง',
      low: 'ต่ำ'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard นักข่าว</h1>
        <p className="text-gray-600">ยินดีต้อนรับ, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total */}
        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เรื่องทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 rounded-xl p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Ready for News */}
        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">พร้อมทำข่าว</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.readyForNews}</p>
            </div>
            <div className="bg-green-100 rounded-xl p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* High Priority */}
        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เร่งด่วน</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.highPriority}</p>
            </div>
            <div className="bg-red-100 rounded-xl p-3">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เดือนนี้</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.thisMonth}</p>
            </div>
            <div className="bg-purple-100 rounded-xl p-3">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">เรื่องร้องเรียนล่าสุด</h2>
          <Link 
            to="/journalist/complaints" 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ดูทั้งหมด →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">หัวข้อ</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">หมวดหมู่</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ความสำคัญ</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">มูลค่าความเสียหาย</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">วันที่</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {recentComplaints.map((complaint) => (
                <tr key={complaint.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <p className="font-medium text-gray-900">{complaint.title}</p>
                  </td>
                  <td className="py-4 px-4">
                    {getCategoryBadge(complaint.category)}
                  </td>
                  <td className="py-4 px-4">
                    {getPriorityBadge(complaint.priority)}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    ฿{complaint.amount}
                  </td>
                  <td className="py-4 px-4 text-gray-600 text-sm">
                    {new Date(complaint.date).toLocaleDateString('th-TH')}
                  </td>
                  <td className="py-4 px-4">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JournalistDashboard;