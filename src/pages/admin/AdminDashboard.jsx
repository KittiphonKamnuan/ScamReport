import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats] = useState({
    totalCases: 9999,
    totalAmount: 99999999999,
    victimCount: 999999
  });

  const [chartFilter, setChartFilter] = useState('month');

  // Mock data for chart - จำนวนเคสต่อเดือน
  const chartData = [
    { month: 'ม.ค.', value: 9500 },
    { month: 'ก.พ.', value: 14500 },
    { month: 'มี.ค.', value: 12000 },
    { month: 'เม.ย.', value: 7500 },
    { month: 'พ.ค.', value: 17000 },
    { month: 'มิ.ย.', value: 7500 },
    { month: 'ก.ค.', value: 14500 },
    { month: 'ส.ค.', value: 19500 },
    { month: 'ก.ย.', value: 9500 },
    { month: 'ต.ค.', value: 12500 },
    { month: 'พ.ย.', value: 14500 },
    { month: 'ธ.ค.', value: 7500 },
    { month: 'พ.ย.', value: 12500 }
  ];

  // New scam types
  const newScamTypes = [
    { name: 'AI Voice Scam', contact: 'ไผ่', phone: '0999999999' },
    { name: 'Deepfake Scam', contact: 'หนุ่ม', phone: '0888888888' },
    { name: 'Investment Bot', contact: 'มาร์ค', phone: '0987654321' },
    { name: 'Subscription Trap', contact: 'ครีม', phone: '0977777777' }
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 - จำนวนเคสทั้งหมด */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-2">จำนวนเคสทั้งหมด</h3>
            <p className="text-4xl font-bold">{stats.totalCases.toLocaleString()}</p>
          </div>
          {/* Icon decoration */}
          <div className="absolute right-4 bottom-4 opacity-20">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
            </svg>
          </div>
        </div>

        {/* Card 2 - ยอดที่เสียหายมากที่สุด */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-2">ยอดที่เสียหายมากที่สุด</h3>
            <p className="text-4xl font-bold">{stats.totalAmount.toLocaleString()}</p>
          </div>
          {/* Icon decoration */}
          <div className="absolute right-4 bottom-4 opacity-20">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
            </svg>
          </div>
        </div>

        {/* Card 3 - ประเภทการโกงยอดนิยม */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-2">ประเภทการโกงยอดนิยม</h3>
            <p className="text-4xl font-bold">โดนปล้นนกยูง</p>
          </div>
          {/* Icon decoration */}
          <div className="absolute right-4 bottom-4 opacity-20">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Chart and New Scam Types Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">สรุปจำนวนเคสทั้งหมด</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartFilter('day')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartFilter === 'day'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                วัน
              </button>
              <button
                onClick={() => setChartFilter('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartFilter === 'week'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                สัปดาห์
              </button>
              <button
                onClick={() => setChartFilter('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartFilter === 'month'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                เดือน
              </button>
              <button
                onClick={() => setChartFilter('year')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartFilter === 'year'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ปี
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-600">จำนวนเคสของผู้เสียหาย</span>
          </div>

          {/* Bar Chart */}
          <div className="relative h-80">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500">
              <span>25 k</span>
              <span>20 k</span>
              <span>15 k</span>
              <span>10 k</span>
              <span>5 k</span>
              <span>0 k</span>
            </div>

            {/* Chart area */}
            <div className="ml-12 h-full flex items-end gap-4 pb-8">
              {chartData.map((item, index) => {
                const height = (item.value / maxValue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-orange-500 rounded-t-lg transition-all duration-300 hover:bg-orange-600 cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${item.month}: ${item.value.toLocaleString()}`}
                    ></div>
                    <span className="text-xs text-gray-600 font-medium">{item.month}</span>
                  </div>
                );
              })}
            </div>

            {/* Horizontal grid lines */}
            <div className="absolute inset-0 ml-12 pointer-events-none">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-gray-200"
                  style={{ top: `${i * 20}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* New Scam Types Section */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">กลโกงรูปแบบใหม่</h2>
          <div className="space-y-4">
            {newScamTypes.map((scam, index) => (
              <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                <h3 className="font-semibold text-gray-900 mb-1">{scam.name}</h3>
                <p className="text-sm text-gray-600">คุณ{scam.contact}</p>
                <p className="text-sm text-gray-500">{scam.phone}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;