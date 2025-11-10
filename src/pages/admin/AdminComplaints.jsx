import React, { useState, useEffect } from 'react';
import { complaintApi } from '../../services/complaintApi';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    status: '',
    gender: ''
  });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSummary, setChatSummary] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);

  // Mock Data - ตรงกับรูปที่ส่งมา
  const mockComplaints = [
    {
      id: 1,
      date: '2/1/2024',
      category: 'กรุงเทพมหานคร',
      subCategory: 'มกราคม',
      description: 'มิจฉาชีพหลอกลงทุน 50,000 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'ชาย',
      age: 20,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'นักศึกษา',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    },
    {
      id: 2,
      date: '3/1/2024',
      category: 'กรุงเทพมหานคร',
      subCategory: 'มกราคม',
      description: 'มิจฉาชีพหลอกลงทุน NVDA 50,000,000 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'ชาย',
      age: 21,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'นักศึกษา',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    },
    {
      id: 3,
      date: '3/1/2024',
      category: 'กรุงเทพมหานคร',
      subCategory: 'มกราคม',
      description: 'โดนหลอกเงินจาก call center 100,000 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'หญิง',
      age: 29,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'นักศึกษา',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    },
    {
      id: 4,
      date: '5/1/2024',
      category: 'กรุงเทพมหานคร',
      subCategory: 'มกราคม',
      description: 'หนุ่มโดนหลอกขายนก 2,500 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'ชาย',
      age: 100,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'นักศึกษา',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    },
    {
      id: 5,
      date: '7/1/2024',
      category: 'กรุงเทพมหานคร',
      subCategory: 'มกราคม',
      description: 'มาร์คโดน Call Center หลอก 10,000,000 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'หญิง',
      age: 35,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'นักศึกษา',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    },
    {
      id: 6,
      date: '7/1/2024',
      category: 'กรุงเทพมหานคร',
      subCategory: 'กุมภาพันธ์',
      description: 'ครีมโดนหลอกซื้อบัตรคอน BUS 6,500 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'หญิง',
      age: 47,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'นักศึกษา',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    },
    {
      id: 7,
      date: '8/1/2024',
      category: 'กรุงเทพมหานคร',
      subCategory: 'กุมภาพันธ์',
      description: 'ไผ่โดนมิจฉาชีพหลอกเติมเกม 500,000 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'ชาย',
      age: 38,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'พ่อค้า',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    },
    {
      id: 8,
      date: '9/1/2024',
      category: 'กระบี',
      subCategory: 'มีนาคม',
      description: 'แฮมหลอกไผ่ลงทุน 100,000,000 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'ชาย',
      age: 22,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'นักศึกษา',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    },
    {
      id: 9,
      date: '9/1/2024',
      category: 'ปทุมธานี',
      subCategory: 'มีนาคม',
      description: 'ไผ่โดนหลอกซื้อกองทุน S&P 500 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'หญิง',
      age: 44,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'นักกวี',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    },
    {
      id: 10,
      date: '9/1/2024',
      category: 'เชียงใหม่',
      subCategory: 'เมษายน',
      description: 'หนุ่มโดนหลอกซื้อจรวดออนไลน์โดยแฮม 20,000 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'หญิง',
      age: 32,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'CEO KamnuanTech',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    },
    {
      id: 11,
      date: '9/1/2024',
      category: 'กรุงเทพมหานคร',
      subCategory: 'เมษายน',
      description: 'มิวโดนสาวหลอกออนไลน์เกือบหมดตัว 150,000 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'ชาย',
      age: 26,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'นักศึกษา',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    },
    {
      id: 12,
      date: '10/1/2024',
      category: 'กรุงเทพมหานคร',
      subCategory: 'พฤษภาคม',
      description: 'ครับโดนหลอกซื้อบัตรคอน NCT 25,500 บาท',
      status: 'ปัญหาภัยออนไลน์',
      gender: 'ชาย',
      age: 50,
      utility: 'ได้รับคำแนะนำ',
      occupation: 'ที่ปรึกษาทางการเงิน',
      type: 'รับประโยชน์ด้วยตัวเอง',
      count1: 1,
      count2: 1,
      year: 2567
    }
  ];

  // Load data from API
  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      // เรียก API จริง
      const data = await complaintApi.getComplaints({ limit: 1000 });

      // ถ้า API ส่งข้อมูลมา ใช้ข้อมูลจาก API
      // ถ้าไม่มีข้อมูล ใช้ Mock Data
      if (data && data.length > 0) {
        setComplaints(data);
      } else {
        console.warn('No data from API, using mock data');
        setComplaints(mockComplaints);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      // ถ้า error ให้ใช้ Mock Data
      setComplaints(mockComplaints);
    } finally {
      setLoading(false);
    }
  };

  // เปิด modal แสดงแชท
  const handleViewChat = async (complaint) => {
    setSelectedComplaint(complaint);
    setShowChatModal(true);
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
      // ถ้า API ไม่มีข้อมูล ใช้ mock data
      setChatMessages([
        {
          id: 1,
          sender: 'ผู้ร้องเรียน',
          message: complaint.description || 'ไม่มีข้อมูล',
          timestamp: complaint.date || new Date().toISOString(),
          type: 'user'
        },
        {
          id: 2,
          sender: 'เจ้าหน้าที่',
          message: 'ขอบคุณสำหรับข้อมูล เราจะดำเนินการตรวจสอบ',
          timestamp: new Date().toISOString(),
          type: 'admin'
        }
      ]);

      setChatSummary({
        summary: complaint.description || 'ไม่มีข้อมูลสรุป',
        category: complaint.category || complaint.status || 'ไม่ระบุ',
        amount: '฿' + (complaint.description?.match(/\d{1,3}(,\d{3})*(\.\d+)?/)?.[0] || '0'),
        keywords: ['การฉ้อโกง', 'ออนไลน์', complaint.category || ''].filter(Boolean)
      });
    } finally {
      setLoadingChat(false);
    }
  };

  // ปิด modal
  const handleCloseModal = () => {
    setShowChatModal(false);
    setSelectedComplaint(null);
    setChatMessages([]);
    setChatSummary(null);
  };

  // Filter data
  const filteredComplaints = complaints.filter(complaint => {
  const search = searchTerm.toLowerCase();
  const matchSearch = 
    (complaint.description?.toLowerCase() || '').includes(search) ||
    (complaint.category?.toLowerCase() || '').includes(search) ||
    (complaint.subCategory?.toLowerCase() || '').includes(search);

  const matchCategory = !filters.category || complaint.category === filters.category;
  const matchSubCategory = !filters.subCategory || complaint.subCategory === filters.subCategory;
  const matchStatus = !filters.status || complaint.status === filters.status;
  const matchGender = !filters.gender || complaint.gender === filters.gender;

  return matchSearch && matchCategory && matchSubCategory && matchStatus && matchGender;
});


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ข้อมูลผู้ร้องเรียน</h1>
        <p className="text-sm text-gray-600">จำนวน XX รายการ</p>

    {/* Search Bar */}
    <div className="mt-4 flex items-center gap-3">
        {/* กล่องช่องค้นหา */}
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหา"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px] px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
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
                  <th className="px-4 py-3 text-left text-sm font-semibold">กรณีเป็นตัวแทนระบุชื่อชุมชน/หน่วยงาน</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">กรณีเป็นตัวแทนระบุจำนวนผู้ที่ได้รับ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ปี</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="px-4 py-12 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>ไม่พบข้อมูลที่ค้นหา</p>
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((complaint, index) => (
                    <tr key={complaint.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm">{complaint.date}</td>
                      <td className="px-4 py-3 text-sm">{complaint.category}</td>
                      <td className="px-4 py-3 text-sm">{complaint.subCategory}</td>
                      <td className="px-4 py-3 text-sm">{complaint.description}</td>
                      <td className="px-4 py-3 text-sm">{complaint.status}</td>
                      <td className="px-4 py-3 text-sm">{complaint.gender}</td>
                      <td className="px-4 py-3 text-sm">{complaint.age}</td>
                      <td className="px-4 py-3 text-sm">{complaint.utility}</td>
                      <td className="px-4 py-3 text-sm">{complaint.occupation}</td>
                      <td className="px-4 py-3 text-sm">{complaint.type}</td>
                      <td className="px-4 py-3 text-sm text-center">{complaint.count1}</td>
                      <td className="px-4 py-3 text-sm text-center">{complaint.count2}</td>
                      <td className="px-4 py-3 text-sm text-center">{complaint.year}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => handleViewChat(complaint)}
                          className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                        >
                          แชท
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

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-orange-500 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">รายละเอียดเรื่องร้องเรียน</h2>
                {selectedComplaint && (
                  <p className="text-sm opacity-90 mt-1">
                    {selectedComplaint.description}
                  </p>
                )}
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
              ) : (
                <div className="space-y-6">
                  {/* Summary Section */}
                  {chatSummary && (
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="bg-orange-500 text-white rounded-full p-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">สรุปเรื่องร้องเรียน</h3>
                          <p className="text-gray-700 leading-relaxed">{chatSummary.summary}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-orange-200">
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
                              <span key={idx} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chat Messages Section */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                      <div className="bg-blue-500 text-white rounded-full p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">ข้อความสนทนา</h3>
                    </div>

                    <div className="space-y-4">
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
                            className={`border-l-4 pl-4 py-3 ${
                              msg.type === 'admin'
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-orange-400 bg-orange-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  msg.type === 'admin'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-orange-100 text-orange-800'
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

export default AdminComplaints;