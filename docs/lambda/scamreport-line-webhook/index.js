import crypto from 'crypto';
import { getOrCreateSession, addMessageToSession, shouldCreateComplaint, closeSession } from './sessionManager.js';
import { createComplaintInRDS, appendMessageToComplaint } from './database.js';
import { analyzeWithGemini } from './geminiAI.js';
import { extractEntities } from './entityExtractor.js';
import { categorizeComplaint, detectUrgency } from './categorizer.js';
import { uploadLineMediaToS3 } from './s3Uploader.js';

// Environment variables
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

/**
 * Verify LINE signature (FIXED)
 */
function verifySignature(body, signature) {
  // Skip verification for test events
  if (!signature || signature === 'test-signature') {
    console.log('⚠️ Test signature detected, skipping verification');
    return true; // Allow test events
  }
  
  try {
    const hash = crypto
      .createHmac('sha256', LINE_CHANNEL_SECRET)
      .update(body)
      .digest('base64');
    
    // Check if lengths match before comparing
    const sigBuffer = Buffer.from(signature);
    const hashBuffer = Buffer.from(hash);
    
    if (sigBuffer.length !== hashBuffer.length) {
      console.error('❌ Signature length mismatch:', {
        signatureLength: sigBuffer.length,
        hashLength: hashBuffer.length
      });
      return false;
    }
    
    return crypto.timingSafeEqual(sigBuffer, hashBuffer);
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}

/**
 * Get LINE user profile
 */
async function getLineProfile(userId) {
  try {
    const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Error fetching LINE profile:', error);
    return null;
  }
}

/**
 * Send reply to LINE
 */
async function replyToLine(replyToken, messages) {
  // Skip for test tokens
  if (replyToken === 'test-reply-token') {
    console.log('⚠️ Test reply token, skipping LINE API call');
    return true;
  }
  
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken,
        messages
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error replying to LINE:', error);
    return false;
  }
}

/**
 * Check if this is an online fraud/scam case
 */
function isOnlineFraudCase(text, entities) {
  if (!text) return false;

  // Check for money transfer keywords
  const transferKeywords = /โอนเงิน|โอนไป|โอนให้|จ่ายเงิน|ส่งเงิน|ชำระเงิน/i;
  const hasTransfer = transferKeywords.test(text);

  // Check for fraud/scam keywords
  const fraudKeywords = /หลอก|โกง|ถูกโกง|มิจฉาชีพ|หลอกลวง|ฉ้อโกง|สแกม|scam/i;
  const hasFraud = fraudKeywords.test(text);

  // Check for money loss keywords
  const lossKeywords = /สูญเงิน|เสียเงิน|สูญหาย|ความเสียหาย/i;
  const hasLoss = lossKeywords.test(text);

  // Check if has amount
  const hasAmount = entities.amounts && entities.amounts.length > 0;

  // Online fraud case if:
  // 1. Has transfer + fraud keywords, OR
  // 2. Has transfer + loss keywords, OR
  // 3. Has fraud + amount, OR
  // 4. Has loss + amount
  return (
    (hasTransfer && hasFraud) ||
    (hasTransfer && hasLoss) ||
    (hasFraud && hasAmount) ||
    (hasLoss && hasAmount)
  );
}

/**
 * Main Lambda Handler
 */
export async function handler(event) {
  console.log('Event received:', JSON.stringify(event, null, 2));
  
  // Get headers (case-insensitive)
  const headers = Object.keys(event.headers || {}).reduce((acc, key) => {
    acc[key.toLowerCase()] = event.headers[key];
    return acc;
  }, {});
  
  // Get body
  const body = event.isBase64Encoded 
    ? Buffer.from(event.body, 'base64').toString('utf-8')
    : event.body;
  
  // Verify signature
  const signature = headers['x-line-signature'];
  if (!verifySignature(body, signature)) {
    console.error('❌ Invalid signature');
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid signature' })
    };
  }
  
  console.log('✅ Signature verified');
  
  // Parse webhook payload
  const payload = JSON.parse(body);
  const events = payload.events || [];
  
  if (events.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'No events' })
    };
  }
  
  // Process each event
  for (const lineEvent of events) {
    try {
      await processLineEvent(lineEvent);
    } catch (error) {
      console.error('Error processing event:', error);
      // Continue processing other events
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'OK' })
  };
}

/**
 * Process single LINE event
 */
async function processLineEvent(lineEvent) {
  console.log('Processing event:', lineEvent.type);
  
  // Only process message events
  if (lineEvent.type !== 'message') {
    console.log('Skipping non-message event');
    return;
  }
  
  const message = lineEvent.message;
  const source = lineEvent.source;
  const userId = source.userId;
  const replyToken = lineEvent.replyToken;
  
  if (!userId) {
    console.log('No userId found, skipping');
    return;
  }
  
  // Get message type and text
  const messageType = message.type.toLowerCase();
  const text = messageType === 'text' ? message.text : null;
  
  console.log(`Message from ${userId}: ${text || `[${messageType}]`}`);
  
  // Get user profile (skip for test users)
  let displayName = 'ผู้ใช้ LINE';
  if (!userId.startsWith('U1234567890')) { // Skip for test user IDs
    const profile = await getLineProfile(userId);
    displayName = profile?.displayName || displayName;
  }
  
  // Upload non-text LINE messages (image, video, audio, file) to S3
  let mediaInfo = null;
  if (['image', 'video', 'audio', 'file'].includes(messageType)) {
    try {
      mediaInfo = await uploadLineMediaToS3({
        messageId: message.id,
        userId,
        messageType,
        eventTime: lineEvent.timestamp
      });
      console.log('S3 media uploaded:', mediaInfo);
    } catch (e) {
      console.error('Upload media to S3 failed:', e);
      // Do not crash original flow if upload fails
    }
  }

  // Step 1: Get or create session
  let session = await getOrCreateSession(userId);
  console.log(`Session ${session.session_id}, messages: ${session.message_count}`);
  
  // Step 2: Add message to session
  session = await addMessageToSession(session, {
    message_id: message.id,
    text,
    type: messageType,
    timestamp: new Date(lineEvent.timestamp).toISOString(),
    // Added: store uploaded media metadata inside session message
    media: mediaInfo ? {
      bucket: mediaInfo.bucket,
      key: mediaInfo.key,
      s3Uri: mediaInfo.s3Uri,
      contentType: mediaInfo.contentType,
      size: mediaInfo.size
    } : undefined
  });
  
  // Step 3: Analyze accumulated text
  const accumulatedText = session.messages
    .filter(m => m.text)
    .map(m => m.text)
    .join('\n');
  
  // Extract entities
  const entities = extractEntities(accumulatedText);
  console.log('Entities:', entities);
  
  // Categorize
  const categoryResult = categorizeComplaint(accumulatedText, entities);
  console.log('Category:', categoryResult);
  
  // Detect urgency
  const urgencyResult = detectUrgency(accumulatedText, entities);
  console.log('Urgency:', urgencyResult);
  
  // Step 4: Decide if we should create complaint
  if (!session.complaint_id && shouldCreateComplaint(session, { entities, categoryResult, urgencyResult })) {
    console.log('✅ Creating complaint...');
    
    // Use Gemini AI to generate summary
    let geminiSummary = null;
    try {
      geminiSummary = await analyzeWithGemini(accumulatedText, entities, categoryResult.category);
    } catch (error) {
      console.error('Gemini AI error:', error);
    }
    
    // Create complaint in RDS
    const complaintId = await createComplaintInRDS({
      lineUserId: userId,
      displayName,
      messages: session.messages,
      entities,
      categoryResult,
      urgencyResult,
      geminiSummary
    });
    
    // Update session with complaint_id
    session.complaint_id = complaintId;
    session.status = 'complaint_created';
    await closeSession(session);
    
    console.log(`✅ Complaint created: ${complaintId}`);

    // Check if this is an online fraud case
    const isFraudCase = isOnlineFraudCase(accumulatedText, entities);
    console.log(`🔍 Is online fraud case: ${isFraudCase}`);

    // Send acknowledgment to user
    let acknowledgmentText = `✅ ได้รับเรื่องร้องเรียนของคุณแล้วครับ

📋 เลขที่เรื่อง: ${session.complaint_number}`;

    // Add police report reminder for fraud cases
    if (isFraudCase) {
      acknowledgmentText += `

🚨 **สำคัญมาก!**
หากยังไม่ได้แจ้งความ กรุณาแจ้งความออนไลน์ที่
👉 https://thaipoliceonline.go.th/
📌 และส่งใบแจ้งความมาให้ทีมงานด้วย`;
    }

    acknowledgmentText += `

🔍 ทีมงานจะตรวจสอบและติดต่อกลับภายใน 24 ชั่วโมง

📞 ติดต่อสอบถาม:
• 02-790-2630-2, 02-790-2111
• จันทร์-ศุกร์ เวลา 9:00-16:00 น.

📎 หากมีข้อมูลหรือหลักฐานเพิ่มเติม สามารถส่งต่อได้เลยครับ

ขอบคุณที่ไว้วางใจ ไทยพีบีเอส 🙏`;

    await replyToLine(replyToken, [
      {
        type: 'text',
        text: acknowledgmentText
      }
    ]);
    
  } else if (session.complaint_id) {
    console.log(`📝 Appending to complaint: ${session.complaint_id}`);

    // Append to existing complaint
    await appendMessageToComplaint(session.complaint_id, {
      message_id: message.id,
      text,
      type: messageType,
      timestamp: new Date(lineEvent.timestamp).toISOString(),
      // attach media metadata if this message contains a file/image/video/audio
      media: mediaInfo ? {
        bucket: mediaInfo.bucket,
        key: mediaInfo.key,
        s3Uri: mediaInfo.s3Uri,
        contentType: mediaInfo.contentType,
        size: mediaInfo.size
      } : undefined
    }, { entities, categoryResult, urgencyResult });

    // Check if this is an online fraud case
    const isFraudCase = isOnlineFraudCase(accumulatedText, entities);

    // Send acknowledgment with reminder for phone number and police report
    let appendText = `✅ รับข้อมูลเพิ่มเติมแล้วครับ

📋 เลขที่เรื่อง: ${session.complaint_number}

ขอบคุณสำหรับข้อมูลเพิ่มเติม 🙏`;

    // Add police report reminder for fraud cases
    if (isFraudCase) {
      appendText += `

🚨 **สำคัญมาก!**
หากยังไม่ได้แจ้งความ กรุณาแจ้งความออนไลน์ที่
👉 https://thaipoliceonline.go.th/
📌 และส่งใบแจ้งความมาให้ทีมงานด้วย`;
    }

    appendText += `

📞 หากยังไม่ได้แจ้งเบอร์โทรศัพท์ กรุณาแจ้งเบอร์ติดต่อของคุณด้วยครับ (สำคัญมากเพื่อให้ทีมงานติดต่อกลับ)

📎 หากมีหลักฐานเพิ่มเติม สามารถส่งต่อได้เลยครับ`;

    await replyToLine(replyToken, [
      {
        type: 'text',
        text: appendText
      }
    ]);
    
  } else {
    console.log('⏳ Waiting for more details...');

    // Check if this is the first message (welcome message)
    const isFirstMessage = session.message_count === 1;

    if (isFirstMessage) {
      // Send welcome message with full instructions
      await replyToLine(replyToken, [
        {
          type: 'text',
          text: `สวัสดีครับ ยินดีต้อนรับสู่ระบบร้องเรียนร้องทุกข์ไทยพีบีเอส 📢

🚨 **สำคัญมาก! หากถูกหลอกออนไลน์/โอนเงิน:**
⚠️ กรุณาแจ้งความออนไลน์ก่อนที่
👉 https://thaipoliceonline.go.th/
📌 การแจ้งความเป็นขั้นตอนแรกที่สำคัญที่สุด!

หลังจากแจ้งความแล้ว กรุณาส่งข้อมูลมาตามลำดับดังนี้:

📞 **1. เบอร์โทรศัพท์ของคุณ (สำคัญที่สุด!)**
• เพื่อให้ทีมงานติดต่อกลับได้

📖 **2. เล่าเรื่องเป็นลำดับ:**
1️⃣ รู้จักผู้ก่อเหตุได้อย่างไร
2️⃣ ทำไมถึงเชื่อ/อะไรเป็นปัจจัยที่ทำให้หลงเชื่อ
3️⃣ โอนเงินเท่าไหร่ กี่ครั้ง รวมความเสียหายเท่าไหร่
4️⃣ กลโกงเฉพาะของมิจฉาชีพ

📎 **3. แนบหลักฐาน:**
• ภาพแชท/บทสนทนา
• หน้าจอแอพพลิเคชัน
• **ใบแจ้งความ (สำคัญ!)**
• รายละเอียดการโอนเงิน

📝 **4. รายละเอียดเพิ่มเติม:**
• เกิดเหตุที่ไหน เมื่อไร อย่างไร
• ชื่อ-นามสกุลของคุณ

📞 **ติดต่อทีมงาน:**
• 02-790-2630-2, 02-790-2111
• วันจันทร์-ศุกร์ เวลา 9:00-16:00 น.

✅ แอดมินจะตอบกลับในช่วงเวลาทำการ
⏰ นอกเวลาทำการจะตอบกลับในเช้าวันถัดไป

กรุณาส่งข้อมูลมาได้เลยครับ 🙏`
        }
      ]);
    } else {
      // Send reminder for more details
      await replyToLine(replyToken, [
        {
          type: 'text',
          text: `📝 กรุณาให้รายละเอียดเพิ่มเติมครับ:

🚨 **หากถูกหลอกออนไลน์/โอนเงิน:**
⚠️ กรุณาแจ้งความออนไลน์ก่อนที่
👉 https://thaipoliceonline.go.th/
📌 และแนบใบแจ้งความด้วย

📞 **เบอร์โทรศัพท์ของคุณ (สำคัญที่สุด!)**

📖 **เล่าเรื่องเป็นลำดับ:**
1️⃣ รู้จักผู้ก่อเหตุได้อย่างไร
2️⃣ ทำไมถึงเชื่อ/หลงเชื่อ
3️⃣ โอนเงินเท่าไหร่ กี่ครั้ง รวมความเสียหาย
4️⃣ กลโกงเฉพาะของมิจฉาชีพ

📎 **อย่าลืมแนบหลักฐาน:**
• ภาพแชท/บทสนทนา
• หน้าจอแอพ
• **ใบแจ้งความ (ถ้ามี)**
• รายละเอียดการโอนเงิน

ยิ่งให้รายละเอียดครบ ทีมงานจะช่วยได้ดีขึ้นครับ 🙏`
        }
      ]);
    }
  }
}
