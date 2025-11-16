import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze text with Gemini AI
 */
export async function analyzeWithGemini(text, entities, category) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `คุณคือ AI ผู้ช่วยวิเคราะห์เรื่องร้องเรียนสำหรับนักข่าว

ข้อความร้องเรียน:
${text}

ข้อมูลที่สกัดได้:
- เบอร์โทร: ${entities.phones.join(', ') || 'ไม่มี'}
- จำนวนเงิน: ${entities.amounts.join(', ') || 'ไม่มี'} บาท
- หมวดหมู่เบื้องต้น: ${category}

กรุณาวิเคราะห์และสรุปในรูปแบบ JSON:
{
  "summary": "สรุปสั้นๆ 3-5 ประโยค",
  "title": "หัวข้อข่าว (ไม่เกิน 100 ตัวอักษร)",
  "keyPoints": ["จุดสำคัญ 1", "จุดสำคัญ 2", "จุดสำคัญ 3"],
  "scamType": "ประเภทการหลอกลวง",
  "urgencyAssessment": "ประเมินความเร่งด่วน",
  "recommendedAction": "คำแนะนำเบื้องต้น"
}

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();
    
    // Extract JSON from response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      console.log('Gemini AI analysis:', analysis);
      return analysis;
    }
    
    return null;
    
  } catch (error) {
    console.error('Gemini AI error:', error);
    return null;
  }
}