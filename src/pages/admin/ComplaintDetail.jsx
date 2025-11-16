// ComplaintDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintApi } from '../../services/complaintApi';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [complaint, setComplaint] = useState(null);
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState(null); // (State นี้จะเก็บ object จาก Lambda 1)

  // 🔽 (*** เพิ่มใหม่ ***) 🔽
  // States สำหรับปุ่ม AI
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  // 🔼 (*** สิ้นสุดส่วนที่เพิ่ม ***) 🔼

  useEffect(() => {
    if (id) {
      loadComplaintData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 🔽 (*** เพิ่มใหม่ ***) 🔽
  // แยกฟังก์ชันโหลด Summary ออกมา เพื่อให้เรียกซ้ำได้
  const loadSummary = async () => {
    try {
      // (เราเรียก getComplaintSummary จาก Lambda ตัวเก่า (admin-manager-api))
      const summaryResponse = await complaintApi.getComplaintSummary(id);
      console.log('Summary response (from loadSummary):', summaryResponse);
      
      // (summaryResponse คือ object ที่ได้จาก Lambda ซึ่งมี summary, contact_name, ฯลฯ)
      setSummary(summaryResponse); 

    } catch (summaryError) {
      console.warn('Could not load summary:', summaryError);
      setSummary(null);
    }
  };
  // 🔼 (*** สิ้นสุดส่วนที่เพิ่ม ***) 🔼

  const loadComplaintData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading complaint detail for ID:', id);

      // 1) โหลดข้อความ + complaint basic info
      const messagesResponse = await complaintApi.getComplaintMessages(id);
      console.log('Messages response:', messagesResponse);

      const messagesData =
        messagesResponse.messages ||
        messagesResponse.data ||
        messagesResponse;

      setMessages(Array.isArray(messagesData) ? messagesData : []);

      // ตั้งค่าข้อมูลพื้นฐานของ complaint
      setComplaint({
        id: id,
        title:
          messagesResponse.complaint_title ||
          messagesResponse.title ||
          'ไม่มีหัวเรื่อง',
        status:
          messagesResponse.complaint_status ||
          messagesResponse.status ||
          'pending',
        messageCount: messagesResponse.count || messagesData.length || 0,
      });

      // 2. โหลด summary (*** เรียกฟังก์ชันใหม่ ***)
      await loadSummary();
    
    } catch (err) { // ⬅️ 'try' ปิดตรงนี้
      console.error('Error loading complaint detail:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    } 
  }; 

  // 🔽 (*** นี่คือจุดที่แก้ไขทั้งหมด ***) 🔽
  // ฟังก์ชันสำหรับปุ่ม "สร้างสรุป"
  // ฟังก์ชันสำหรับปุ่ม "สร้างสรุป"
const handleSummarizeClick = async () => {
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      console.log('Calling createComplaintSummary API (Lambda 2)...');

      // 1. เรียก API (ตัวที่ยิงไป Lambda ใหม่: ai-summarizer-api)
      // newSummaryData จะมีหน้าตาแบบ: { id: '...', summary: '...', key_points: '...', contact_phone: ... }
      const newSummaryData = await complaintApi.createComplaintSummary(id);
      console.log('API response (from Lambda 2):', newSummaryData);

      // 2. (สำคัญ!) เราจะไม่เรียก await loadSummary()
      // แต่เราจะ "สร้าง" object state ใหม่ ให้มีโครงสร้างเหมือนกับที่ loadSummary() สร้าง
      // เพื่อให้ JSX แสดงผลได้ถูกต้อง
      setSummary(prevSummary => ({
        // 1. เก็บของเก่าจาก Lambda 1 (เช่น complaint_title, line_id)
        ...prevSummary, 

        // 2. อัปเดตข้อมูลติดต่อ (จาก Lambda 2)
        contact_name: newSummaryData.contact_name,
        contact_phone: newSummaryData.contact_phone,
        amount: newSummaryData.amount,
        category: newSummaryData.category,

        // 3. สร้าง/อัปเดต "summary" (object ที่ซ้อนอยู่)
        summary: {
          id: newSummaryData.id,
          complaint_id: newSummaryData.complaint_id,
          summary_text: newSummaryData.summary,
          key_points: newSummaryData.key_points,
          created_at: newSummaryData.created_at,
          category: newSummaryData.scam_type, 
        }
      }));

    } catch (err) {
      console.error('Error creating AI summary:', err);
      // (แสดง Error ที่ได้จาก Lambda)
      const errorBody = err.response?.data?.body ? JSON.parse(err.response.data.body) : (err.response?.data || {});
      setSummaryError(errorBody?.error || err.message || 'ไม่สามารถสร้างสรุปได้');
    } finally {
      setIsSummarizing(false);
    }
};
  // 🔼 (*** สิ้นสุดส่วนที่แก้ไข ***) 🔼

  // ... (ฟังก์ชัน formatDate, formatAmount, loading, error เหมือนเดิม) ...
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '-';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };
  if (loading) { /* ... (โค้ดเดิม) ... */ }
  if (error) { /* ... (โค้ดเดิม) ... */ }

  // ===== แสดงเนื้อหาของ message ตามประเภท (text / image / file) =====
  const renderMessageContent = (msg) => {
    const isMedia =
      msg.message_type === 'image' ||
      msg.message_type === 'file';

    // ถ้าเป็นรูปหรือไฟล์ และมี media_url → แสดงรูปหรือปุ่มเปิดไฟล์
    if (isMedia && msg.media_url) {
      // ถ้าเป็น image ให้แสดง <img>
      if (msg.message_type === 'image') {
        return (
          <img
            src={msg.media_url}
            alt={msg.complaint_title || 'แนบรูปภาพ'}
            style={{
              maxWidth: '100%',
              borderRadius: 8,
              display: 'block',
            }}
          />
        );
      }

      // กรณีเป็นไฟล์ชนิดอื่น (เผื่ออนาคต)
      return (
        <a
          href={msg.media_url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          เปิดไฟล์แนบ
        </a>
      );
    }

    // ถ้าเป็น media แต่ยังไม่มี media_url ให้ fallback แสดง key ไว้ก่อน
    if (isMedia && msg.media && msg.media.key) {
      return (
        <span className="text-xs break-all">
          ไฟล์แนบ: {msg.media.key}
        </span>
      );
    }

    // ข้อความปกติ
    return (
      <span className="whitespace-pre-wrap break-words">
        {msg.content || msg.message || ''}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin/history')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            กลับไปหน้ารายการ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        {/* ... (โค้ด Header เดิม) ... */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{complaint?.title || 'รายละเอียดคำร้อง'}</h1>
                <p className="text-sm text-gray-500">ID: {id} • {messages.length} ข้อความ</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  complaint?.status === 'resolved'
                    ? 'bg-green-100 text-green-800'
                    : complaint?.status === 'investigating'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {complaint?.status === 'resolved'
                  ? 'แก้ไขแล้ว'
                  : complaint?.status === 'investigating'
                  ? 'กำลังสอบสวน'
                  : 'รอดำเนินการ'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Original Messages */}
          <div className="bg-white rounded-lg shadow-sm border">
            {/* ... (โค้ดแสดงข้อความเดิม) ... */}
            <div className="border-b bg-gray-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">ข้อความต้นฉบับ</h2>
              <p className="text-sm text-gray-500 mt-1">การสนทนาทั้งหมด ({messages.length} ข้อความ)</p>
            </div>
            <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p>ไม่มีข้อความ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex ${
                        msg.is_from_user ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          msg.is_from_user
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">
                              {msg.is_from_user ? 'ผู้ใช้' : 'ระบบ'}
                            </p>

                            {/* ตรงนี้ใช้ helper แสดงข้อความหรือรูป */}
                            <div className="text-sm">
                              {renderMessageContent(msg)}
                            </div>

                            <p
                              className={`text-xs mt-2 ${
                                msg.is_from_user
                                  ? 'text-blue-100'
                                  : 'text-gray-500'
                              }`}
                            >
                              {formatDate(msg.sent_at || msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - AI Summary & Details */}
          <div className="space-y-6">
            {/* AI Summary Section */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  สรุปโดย AI
                </h2>
              </div>

              <div className="p-6">
                {/* 🔽 (*** นี่คือจุดที่แก้ไข ***) 🔽 */}
                {/* (ข้อมูล summary จะอยู่ใน summary.summary (ซ้อนกัน) ตามโค้ด state ของเรา) */}
                {summary?.summary?.summary_text ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        สรุป
                      </h3>
                      <p className="text-gray-800 leading-relaxed">
                        {summary.summary.summary_text}
                      </p>
                    </div>

                    {summary.summary.key_points &&
                      summary.summary.key_points.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            จุดสำคัญ
                          </h3>
                          <ul className="list-disc list-inside space-y-1">
                            {summary.summary.key_points.map((point, idx) => (
                              <li key={idx} className="text-gray-700">
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {summary.summary.timeline &&
                      summary.summary.timeline.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            ไทม์ไลน์
                          </h3>
                          <div className="space-y-2">
                            {summary.summary.timeline.map((event, idx) => (
                              <div
                                key={idx}
                                className="flex items-start space-x-2"
                              >
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                                <p className="text-gray-700 text-sm">
                                  {event}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {summary.summary.category && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                          ประเภทการหลอกลวง
                        </h3>
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {summary.summary.category}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <p className="text-sm">ยังไม่มีสรุปจาก AI</p>
                  </div>
                )}

                {/* ปุ่มสร้างสรุป (แสดงตลอด) */}
                <div className="mt-4 pt-4 border-t text-center">
                   <button
                      onClick={handleSummarizeClick} // (แก้ onClick)
                      disabled={isSummarizing} // (เพิ่ม disabled)
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {/* (แก้ข้อความ) */}
                      {isSummarizing ? 'กำลังประมวลผล...' : (summary?.summary ? 'สร้างสรุปใหม่' : 'สร้างสรุป')}
                    </button>
                    
                    {/* (เพิ่มส่วนแสดง Error) */}
                    {summaryError && (
                      <p className="text-red-500 text-sm mt-2">{summaryError}</p>
                    )}
                </div>
                {/* 🔼 (*** สิ้นสุดส่วนที่แก้ไข ***) 🔼 */}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b bg-gray-50 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  ข้อมูลการติดต่อ
                </h2>
              </div>

              {/* 🔽 (*** นี่คือจุดที่แก้ไข ***) 🔽 */}
              {/* (ข้อมูลติดต่อจะอยู่ใน summary (object นอก) ไม่ใช่ summary.summary) */}
              <div className="p-6 space-y-4">
                {summary?.contact_name && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-600">
                      ชื่อ:
                    </div>
                    <div className="flex-1 text-gray-800">
                      {summary.contact_name}
                    </div>
                  </div>
                )}
                {summary?.contact_phone && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-600">
                      เบอร์โทร:
                    </div>
                    <div className="flex-1 text-gray-800">
                      {summary.contact_phone}
                    </div>
                  </div>
                )}
                {summary?.line_display_name && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-600">
                      LINE:
                    </div>
                    <div className="flex-1 text-gray-800">
                      {summary.line_display_name}
                    </div>
                  </div>
                )}
                {summary?.line_id && (
                  <div className="flex items-start">
                    <div className="w-32 text-sm font-medium text-gray-600">
                      LINE ID:
                    </div>
                    <div className="flex-1 text-gray-800 font-mono text-sm">
                      {summary.line_id}
                    </div>
                  </div>
                )}

                {!summary?.contact_name &&
                  !summary?.contact_phone &&
                  !summary?.line_display_name && (
                    <p className="text-gray-500 text-center py-4">
                      ไม่มีข้อมูลการติดต่อ
                    </p>
                  )}
              </div>
              {/* 🔼 (*** สิ้นสุดส่วนที่แก้ไข ***) 🔼 */}
            </div>

            {/* Financial Damage */}
            {summary?.amount > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                {/* ... (โค้ด Financial Damage เดิม) ... */}
                <div className="border-b bg-red-50 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    ความเสียหาย
                  </h2>
                </div>
                 <div className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      จำนวนเงินที่สูญเสีย
                    </p>
                    <p className="text-3xl font-bold text-red-600">
                      {formatAmount(summary.amount)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;