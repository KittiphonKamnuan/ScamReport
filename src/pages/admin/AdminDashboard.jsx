import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats] = useState({
    total: 156,
    pending: 23,
    inProgress: 45,
    completed: 88
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">ยินดีต้อนรับ, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total */}
        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เรื่องร้องเรียนทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">+12% จากเดือนที่แล้ว</p>
            </div>
            <div className="bg-blue-100 rounded-xl p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">รอดำเนินการ</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
              <p className="text-xs text-gray-500 mt-1">ต้องตรวจสอบภายใน 24 ชม.</p>
            </div>
            <div className="bg-yellow-100 rounded-xl p-3">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">กำลังดำเนินการ</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.inProgress}</p>
              <p className="text-xs text-gray-500 mt-1">โดยทีมข่าว</p>
            </div>
            <div className="bg-blue-100 rounded-xl p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="card hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">เสร็จสิ้น</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
              <p className="text-xs text-gray-500 mt-1">เดือนนี้</p>
            </div>
            <div className="bg-green-100 rounded-xl p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">เรื่องร้องเรียนล่าสุด</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ดูทั้งหมด →
          </button>
        </div>
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>ยังไม่มีเรื่องร้องเรียนในขณะนี้</p>
          <p className="text-sm mt-1">เมื่อมีเรื่องร้องเรียนเข้ามาจะแสดงที่นี่</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;