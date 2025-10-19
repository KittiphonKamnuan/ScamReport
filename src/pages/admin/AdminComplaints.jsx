import React, { useState, useEffect } from 'react';

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

  // Load data (Mock หรือ API)
  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      // TODO: แทนที่ด้วย API call จริง
      // const response = await fetch('YOUR_LAMBDA_API_URL/complaints');
      // const data = await response.json();
      // setComplaints(data);
      
      // ใช้ Mock Data ก่อน
      setTimeout(() => {
        setComplaints(mockComplaints);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading complaints:', error);
      setLoading(false);
    }
  };

  // Filter data
  const filteredComplaints = complaints.filter(complaint => {
    const matchSearch = 
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.location.toLowerCase().includes(searchTerm.toLowerCase());

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
                  <th className="px-4 py-3 text-left text-sm font-semibold">แก้ไข</th>
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
                        <button className="text-orange-600 hover:text-orange-700 font-medium">
                          แก้ไข
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
    </div>
  );
};

export default AdminComplaints;