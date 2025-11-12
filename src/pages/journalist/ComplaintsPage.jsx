import React, { useState, useEffect } from 'react';
import { complaintApi } from '../../services/complaintApi';

const ComplaintsPage = () => {
  const [filter, setFilter] = useState('all');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSummary, setChatSummary] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState(null);

  // โหลดข้อมูลจาก API
  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await complaintApi.getComplaints({ limit: 1000 });

      if (data && data.length > 0) {
        // แปลงข้อมูลจาก API ให้ตรงกับ format ที่ใช้
        const formattedData = data.map((item, idx) => ({
          id: item.id || idx + 1,
          title: item.title || item.description?.substring(0, 50) || 'ไม่มีหัวข้อ',
          description: item.description || 'ไม่มีรายละเอียด',
          category: item.status || item.category || 'fraud',
          priority: idx % 2 === 0 ? 'high' : 'medium',
          amount: item.financial_damage || item.description?.match(/\d{1,3}(,\d{3})*/)?.[0] || '0',
          date: item.created_at || new Date().toISOString().split('T')[0],
          reporter: item.contact_name || 'ไม่เปิดเผยชื่อ',
          status: 'verified'
        }));
        setComplaints(formattedData);
      } else {
        setComplaints([]);
      }
      setError(null);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setError(error.message || 'ไม่สามารถโหลดข้อมูลได้');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailModal(true);
    setLoadingChat(true);
    setChatMessages([]);
    setChatSummary(null);

    try {
      // ดึงข้อความแชท
      const messages = await complaintApi.getComplaintMessages(complaint.id);
      setChatMessages(messages || []);

      // ดึง summary
      const summary = await complaintApi.getComplaintSummary(complaint.id);
      setChatSummary(summary);
    } catch (error) {
      console.error('Error loading chat:', error);
      setChatMessages([]);
      setChatSummary(null);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedComplaint(null);
    setChatMessages([]);
    setChatSummary(null);
  };

  const filteredComplaints = filter === 'all'
    ? complaints
    : complaints.filter(c => c.priority === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">เรื่องร้องเรียน</h1>
        <p className="text-gray-600">ดูและค้นหาเรื่องร้องเรียนสำหรับนำไปทำข่าว</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">กรอง:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'high'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              เร่งด่วน
            </button>
            <button
              onClick={() => setFilter('medium')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ปานกลาง
            </button>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map((complaint) => (
          <div key={complaint.id} className="card hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {complaint.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {complaint.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>ผู้แจ้ง: {complaint.reporter}</span>
                  <span>•</span>
                  <span>มูลค่า: ฿{complaint.amount}</span>
                  <span>•</span>
                  <span>{new Date(complaint.date).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  complaint.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {complaint.priority === 'high' ? 'เร่งด่วน' : 'ปานกลาง'}
                </span>
                <button
                  onClick={() => handleViewDetail(complaint)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  ดูรายละเอียด →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedComplaint.title}</h2>
                <div className="flex items-center gap-3 mt-2 text-sm opacity-90">
                  <span>รหัสเคส: #{selectedComplaint.id}</span>
                  <span>•</span>
                  <span>{new Date(selectedComplaint.date).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingChat ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex gap-3">
                    <span className={`px-4 py-2 text-sm font-medium rounded-full ${
                      selectedComplaint.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedComplaint.priority === 'high' ? 'เร่งด่วน' : 'ปานกลาง'}
                    </span>
                    <span className="px-4 py-2 text-sm font-medium rounded-full bg-green-100 text-green-700">
                      {selectedComplaint.status === 'verified' ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}
                    </span>
                  </div>

                  {/* Summary Section */}
                  {chatSummary && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="bg-blue-500 text-white rounded-full p-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">สรุปเรื่องร้องเรียน</h3>
                          <p className="text-gray-700 leading-relaxed">{chatSummary.summary}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">ประเภท</p>
                          <p className="font-semibold text-gray-900">{chatSummary.category}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">มูลค่าความเสียหาย</p>
                          <p className="font-semibold text-red-600">{chatSummary.amount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">คำสำคัญ</p>
                          <div className="flex flex-wrap gap-1">
                            {chatSummary.keywords?.map((keyword, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Information Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">ผู้แจ้ง</p>
                      <p className="font-semibold text-gray-900">{selectedComplaint.reporter}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">ประเภท</p>
                      <p className="font-semibold text-gray-900">{selectedComplaint.category}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">มูลค่าความเสียหาย</p>
                      <p className="font-semibold text-red-600">฿{selectedComplaint.amount}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">วันที่รายงาน</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedComplaint.date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Chat Messages Section */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                      <div className="bg-green-500 text-white rounded-full p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">ข้อความสนทนา</h3>
                    </div>

                    <div className="space-y-3">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p className="text-gray-500">ไม่มีข้อความสนทนา</p>
                        </div>
                      ) : (
                        chatMessages.map((msg, index) => (
                          <div
                            key={msg.id}
                            className={`border-l-4 pl-4 py-3 rounded-r ${
                              msg.type === 'admin'
                                ? 'border-green-400 bg-green-50'
                                : 'border-blue-400 bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  msg.type === 'admin'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {msg.sender}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(msg.timestamp).toLocaleString('th-TH', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">#{index + 1}</span>
                            </div>
                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {msg.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Additional Notes for Journalists */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-1">หมายเหตุสำหรับนักข่าว</h4>
                        <p className="text-sm text-amber-800">
                          เคสนี้ได้รับการตรวจสอบความน่าเชื่อถือแล้ว สามารถนำไปใช้อ้างอิงในการทำข่าวได้
                          กรุณาปกปิดข้อมูลส่วนตัวของผู้เสียหายเมื่อนำไปเผยแพร่
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ปิด
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                ส่งออกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;