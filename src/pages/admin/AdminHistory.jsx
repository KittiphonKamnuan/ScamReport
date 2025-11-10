import React, { useState, useEffect } from 'react';
import { complaintApi } from '../../services/complaintApi';

const AdminHistory = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSummary, setChatSummary] = useState(null);
  const [complaintTitle, setComplaintTitle] = useState(''); // เพิ่ม state สำหรับ complaint title
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState(null);
  const [chatError, setChatError] = useState(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading conversations from API...');

      // เรียก API เพื่อดึงรายการ conversations
      const data = await complaintApi.getComplaints({ limit: 1000 });

      console.log('API Response:', data);

      if (data && Array.isArray(data) && data.length > 0) {
        // แปลงข้อมูลให้ตรงกับ format ที่ต้องการ
        const formattedData = data.map((item, idx) => {
          console.log(`Processing item ${idx}:`, item);

          return {
            id: item.id || item.complaint_id || idx + 1,
            title: item.title || item.complaint_title || 'ไม่มีหัวเรื่อง', // เพิ่ม title
            lineName: item.line_display_name || item.contact_name || item.name || 'ไม่ระบุชื่อ',
            lineDisplayName: item.line_id || item.line_user_id || '-',
            phoneNumber: item.contact_phone || item.phone || item.phone_number || '-',
            category: item.category || item.scam_type || item.status || 'ไม่ระบุประเภท',
            status: item.verification_status || (item.verified ? 'verified' : 'pending'),
            createdAt: item.created_at || item.first_message_at || item.report_date || new Date().toISOString(),
            lastMessageAt: item.last_message_at || item.updated_at || item.modified_at || new Date().toISOString(),
            messageCount: item.message_count || item.total_messages || 0,
            totalAmount: item.total_loss_amount || item.loss_amount || item.amount || '0',
            summary: item.summary || item.ai_summary || item.description || 'ไม่มีข้อมูลสรุป',
            originalMessage: item.original_message || item.first_message || item.initial_report || item.description || 'ไม่มีข้อความต้นฉบับ'
          };
        });

        console.log('Formatted data:', formattedData);
        setConversations(formattedData);
        setError(null);
      } else {
        console.warn('No data received from API or data is empty');
        setConversations([]);
        setError('ไม่มีข้อมูลการสนทนา');
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // View conversation details
  const handleViewConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setShowDetailModal(true);
    setLoadingChat(true);
    setChatMessages([]);
    setChatSummary(null);
    setComplaintTitle(conversation.title || ''); // ตั้งค่า title เริ่มต้น
    setChatError(null);

    try {
      console.log('Loading conversation details for ID:', conversation.id);

      // ดึงข้อความแชท - response รวม complaint_title แล้ว
      const messagesResponse = await complaintApi.getComplaintMessages(conversation.id);
      console.log('Loaded messages response:', messagesResponse);

      // Extract messages array and complaint_title from response
      const messages = messagesResponse.messages || messagesResponse.data || messagesResponse;
      const titleFromApi = messagesResponse.complaint_title || conversation.title || conversation.lineName;

      // อัพเดท complaint title ถ้ามีจาก API
      if (messagesResponse.complaint_title) {
        setComplaintTitle(messagesResponse.complaint_title);
      }

      // แปลงข้อมูล messages ให้ตรงกับ format ที่ต้องการ
      if (messages && Array.isArray(messages)) {
        const formattedMessages = messages.map((msg, idx) => ({
          id: msg.id || msg.message_id || idx + 1,
          sender: msg.sender_name || msg.from || msg.sender || 'ไม่ระบุชื่อ',
          message: msg.message || msg.content || msg.text || '',
          timestamp: msg.timestamp || msg.sent_at || msg.created_at || new Date().toISOString(),
          type: msg.sender_type || msg.type || (msg.is_admin ? 'admin' : 'user'),
          complaintTitle: msg.complaint_title || titleFromApi // เพิ่ม complaint_title ในแต่ละ message
        }));
        setChatMessages(formattedMessages);
        console.log('Complaint Title from API:', titleFromApi);
      } else {
        console.warn('No messages found or invalid format');
        setChatMessages([]);
      }

      // ดึง summary
      const summary = await complaintApi.getComplaintSummary(conversation.id);
      console.log('Loaded summary:', summary);

      // แปลงข้อมูล summary ให้ตรงกับ format ที่ต้องการ
      if (summary) {
        const formattedSummary = {
          summary: summary.summary || summary.ai_summary || summary.text || conversation.summary,
          category: summary.category || summary.scam_type || conversation.category,
          amount: summary.amount || summary.loss_amount || '฿' + conversation.totalAmount,
          keywords: summary.keywords || summary.tags || [],
          lineName: conversation.lineName,
          lineDisplayName: conversation.lineDisplayName,
          phoneNumber: conversation.phoneNumber
        };
        setChatSummary(formattedSummary);
      } else {
        console.warn('No summary found, using conversation data');
        // ใช้ข้อมูลจาก conversation object ถ้าไม่มี summary จาก API
        setChatSummary({
          summary: conversation.summary,
          category: conversation.category,
          amount: '฿' + conversation.totalAmount,
          keywords: [],
          lineName: conversation.lineName,
          lineDisplayName: conversation.lineDisplayName,
          phoneNumber: conversation.phoneNumber
        });
      }
    } catch (error) {
      console.error('Error loading conversation details:', error);
      setChatError(error.message || 'เกิดข้อผิดพลาดในการโหลดรายละเอียดการสนทนา');
      // ไม่ใช้ mock data แล้ว - แสดงข้อความ error แทน
      setChatMessages([]);
      setChatSummary({
        summary: conversation.summary || 'ไม่สามารถโหลดข้อมูลสรุปได้',
        category: conversation.category,
        amount: '฿' + conversation.totalAmount,
        keywords: [],
        lineName: conversation.lineName,
        lineDisplayName: conversation.lineDisplayName,
        phoneNumber: conversation.phoneNumber
      });
    } finally {
      setLoadingChat(false);
    }
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedConversation(null);
    setChatMessages([]);
    setChatSummary(null);
    setComplaintTitle(''); // ล้าง complaint title
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.phoneNumber.includes(searchTerm) ||
    conv.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ประวัติการสนทนา</h1>
            <p className="text-sm text-gray-600 mt-1">ดูข้อความและประวัติการสนทนาทั้งหมด</p>
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
            placeholder="ค้นหาจากชื่อ, เบอร์โทร, ประเภท..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600 font-semibold mb-2">เกิดข้อผิดพลาด</p>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={loadConversations}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500">ไม่พบการสนทนาที่ค้นหา</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleViewConversation(conv)}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {conv.lineName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{conv.lineName}</h3>
                        <p className="text-sm text-gray-500">{conv.lineDisplayName}</p>
                      </div>
                    </div>

                    <div className="ml-15 space-y-2">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {conv.phoneNumber}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {conv.category}
                        </div>
                        <div className="flex items-center gap-1 text-red-600 font-semibold">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ฿{conv.totalAmount}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 line-clamp-2">{conv.summary}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {conv.messageCount} ข้อความ
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(conv.lastMessageAt).toLocaleString('th-TH', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      conv.status === 'verified'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {conv.status === 'verified' ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}
                    </span>
                    <button className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1">
                      ดูรายละเอียด
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-orange-500 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">
                  {complaintTitle || selectedConversation.title || 'รายละเอียดการสนทนา'}
                </h2>
                <p className="text-sm opacity-90 mt-1">ID: #{selectedConversation.id}</p>
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
              {loadingChat ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
              ) : chatError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-600 font-semibold mb-2">เกิดข้อผิดพลาด</p>
                  <p className="text-red-500 text-sm">{chatError}</p>
                  <button
                    onClick={() => handleViewConversation(selectedConversation)}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    ลองใหม่อีกครั้ง
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Contact Info Section */}
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                        {selectedConversation.lineName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">ข้อมูลผู้ติดต่อ</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">ชื่อ LINE</p>
                            <p className="font-semibold text-gray-900">{chatSummary?.lineName || selectedConversation.lineName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">LINE ID</p>
                            <p className="font-semibold text-gray-900">{chatSummary?.lineDisplayName || selectedConversation.lineDisplayName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">เบอร์โทรศัพท์</p>
                            <p className="font-semibold text-gray-900">{chatSummary?.phoneNumber || selectedConversation.phoneNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">ประเภท</p>
                            <p className="font-semibold text-gray-900">{chatSummary?.category || selectedConversation.category}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">มูลค่าความเสียหาย</p>
                            <p className="font-semibold text-red-600">{chatSummary?.amount || '฿' + selectedConversation.totalAmount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">จำนวนข้อความ</p>
                            <p className="font-semibold text-gray-900">{selectedConversation.messageCount} ข้อความ</p>
                          </div>
                        </div>
                      </div>
                    </div>
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
                          <h3 className="text-lg font-bold text-gray-900 mb-2">สรุปเรื่องร้องเรียน (AI Summary)</h3>
                          <p className="text-gray-700 leading-relaxed">{chatSummary.summary}</p>
                        </div>
                      </div>

                      {chatSummary.keywords && chatSummary.keywords.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <p className="text-xs text-gray-600 mb-2">คำสำคัญ</p>
                          <div className="flex flex-wrap gap-2">
                            {chatSummary.keywords.map((keyword, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Original Message Section */}
                  <div className="bg-white rounded-lg p-6 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-purple-500 text-white rounded-full p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">ข้อความต้นฉบับ</h3>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {selectedConversation.originalMessage}
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
                      <h3 className="text-lg font-bold text-gray-900">ข้อความสนทนาทั้งหมด</h3>
                    </div>

                    <div className="space-y-3">
                      {chatMessages.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">ไม่มีข้อความสนทนาเพิ่มเติม</p>
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
              <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                ส่งออกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHistory;
