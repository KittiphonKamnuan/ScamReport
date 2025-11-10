# ScamReport: AI-Powered Complaint Management System

## Project Overview

### Problem Statement
Thai PBS's "สถานีประชาชน" program receives numerous fraud complaints through LINE Official Account. Admins must manually screen, categorize, and process these messages for journalists to investigate and produce news content. This manual process is time-consuming and prone to missing important details.

### Solution
An AI-powered system that automatically:
- Categorizes complaints by type (fraud, legal issues, tip-offs)
- Extracts key entities (amounts, phone numbers, evidence)
- Assesses urgency levels
- Generates summaries for journalists
- Manages editorial workflow from complaint to publication

### Stakeholders
- **ผู้ร้องเรียน**: Citizens reporting fraud incidents
- **แอดมิน LINE OA**: Staff screening and processing messages
- **นักข่าว/ทีมรายการ**: Journalists using processed data for news
- **องค์กร ThaiPBS**: Organization owner and policy setter

## System Architecture

### High-Level Architecture
```
ประชาชน → LINE OA → API Gateway → Lambda Functions → AI Processing → Database
                                       ↓
Admin Dashboard ← WebSocket ← Queue Processing ← AI Results
```

### Technology Stack
- **Frontend**: React.js with WebSocket for real-time updates
- **Backend**: AWS Lambda (Node.js) with API Gateway
- **Database**: 
  - PostgreSQL RDS (persistent data)
  - DynamoDB (session management)
- **AI/ML**: 
  - Google Gemini AI (summarization)
  - Custom entity extraction (Thai language)
  - Rule-based categorization
- **Authentication**: Amazon Cognito with RBAC
- **Infrastructure**: AWS Serverless (Lambda, API Gateway, SQS, CloudWatch)

## Database Schema

### Core Tables

#### complaints
Main complaint records with full editorial workflow support:
```sql
CREATE TABLE complaints (
    id UUID PRIMARY KEY,
    complaint_number VARCHAR(50) UNIQUE,
    line_user_id VARCHAR(255),
    title VARCHAR(500),
    category complaint_category,
    urgency_level urgency_level,
    status complaint_status,
    ai_confidence_score DECIMAL(5,2),
    assigned_to UUID REFERENCES users(id),
    total_loss_amount DECIMAL(15,2),
    consent_status consent_status,
    publication_channel publication_channel,
    -- Editorial workflow fields
    how_met_scammer TEXT,
    why_believed TEXT,
    financial_damage JSONB,
    scam_technique TEXT,
    -- Evidence flags
    has_police_report BOOLEAN,
    has_transfer_evidence BOOLEAN,
    has_chat_screenshots BOOLEAN,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

#### messages
All LINE messages and manual notes:
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    complaint_id UUID REFERENCES complaints(id),
    line_message_id VARCHAR(255) UNIQUE,
    message_type message_type,
    content TEXT,
    raw_content JSONB,
    sequence_number INT,
    sent_at TIMESTAMP WITH TIME ZONE,
    is_from_user BOOLEAN
);
```

#### ai_analysis
AI processing results:
```sql
CREATE TABLE ai_analysis (
    id UUID PRIMARY KEY,
    complaint_id UUID REFERENCES complaints(id),
    predicted_category complaint_category,
    confidence_score DECIMAL(5,2),
    urgency_score DECIMAL(5,2),
    model_name VARCHAR(100),
    entities JSONB,
    keywords JSONB,
    processed_at TIMESTAMP WITH TIME ZONE
);
```

#### summaries
AI-generated summaries (Gemini results):
```sql
CREATE TABLE summaries (
    id UUID PRIMARY KEY,
    complaint_id UUID REFERENCES complaints(id),
    summary_text TEXT,
    key_points JSONB,
    summary_type VARCHAR(50),
    word_count INT,
    created_at TIMESTAMP WITH TIME ZONE
);
```

### Supporting Tables
- **users**: Admin, journalist, editor accounts
- **evidence_checklist**: Evidence tracking per complaint
- **journalist_followups**: Interview and investigation records
- **complaint_comments**: Internal collaboration
- **notifications**: Real-time alerts
- **audit_logs**: Complete activity tracking
- **tags**: Flexible categorization system

### Key Enums
```sql
CREATE TYPE complaint_status AS ENUM (
    'pending', 'awaiting_evidence', 'evidence_complete', 
    'reviewing', 'journalist_reviewing', 'awaiting_consent', 
    'editor_reviewing', 'approved', 'rejected', 
    'scheduled_publication', 'published', 'archived'
);

CREATE TYPE complaint_category AS ENUM (
    'fraud', 'legal_issue', 'tip_off', 'other', 'uncategorized'
);

CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
```

## AI Processing Pipeline

### 1. Session Management (DynamoDB)
```javascript
// Session tracks conversation state
{
  line_user_id: "U1234567890",
  session_id: "session_1729851590_abc123",
  messages: [...],
  accumulated_text: "ถูกหลอกโอนเงิน\nโอนไป 50000 บาท",
  message_count: 2,
  status: "awaiting_details"
}
```

### 2. Entity Extraction
```javascript
// Extract key information from Thai text
{
  amounts: [50000],           // จำนวนเงิน
  phones: ["0812345678"],     // เบอร์โทรศัพท์
  urls: ["https://fake-bank.com"],
  lineIds: ["scammer123"],
  bankAccounts: ["1234567890"]
}
```

### 3. Categorization Rules
```javascript
const CATEGORY_KEYWORDS = {
  fraud: ['หลอก', 'โกง', 'ฉ้อโกง', 'ลงทุนปลอม'],
  legal_issue: ['ทนายความ', 'คดีความ', 'ศาล'],
  tip_off: ['แจ้งเบาะแส', 'พบเห็น', 'เตือนภัย']
};
```

### 4. Urgency Assessment
- **Critical (80+)**: "ด่วนมาก", "กำลังโอน", amount > 1M
- **High (50-79)**: "ด่วน", "วันนี้", amount 500K-1M
- **Medium (25-49)**: "ช่วยหน่อย", amount 100K-500K
- **Low (<25)**: "นานแล้ว", amount < 100K

### 5. Complaint Creation Criteria
```javascript
function shouldCreateComplaint(session, analysis) {
  return (
    session.message_count >= 2 &&           // Min 2 messages
    analysis.entities.amounts.length > 0 && // Has amount
    (analysis.categoryResult.confidence >= 70 || // High confidence
     /โอนเงิน|หลอก|โกง/.test(session.accumulated_text)) // Critical keywords
  );
}
```

### 6. Gemini AI Integration
```javascript
const prompt = `
ข้อความร้องเรียน: ${text}
ข้อมูลที่สกัดได้: เบอร์ ${phones}, เงิน ${amounts} บาท

กรุณาวิเคราะห์และสรุปในรูปแบบ JSON:
{
  "summary": "สรุปสั้นๆ 3-5 ประโยค",
  "title": "หัวข้อข่าว",
  "keyPoints": ["จุดสำคัญ 1", "จุดสำคัญ 2"],
  "scamType": "ประเภทการหลอกลวง",
  "urgencyAssessment": "ประเมินความเร่งด่วน"
}
`;
```

## Lambda Functions Architecture

### 1. Authentication & User Management
```javascript
// GET /api/v1/auth/profile
exports.getUserProfile = async (event) => {
  // Validate Cognito JWT
  // Return user info + permissions
};

// PUT /api/v1/auth/profile
exports.updateUserProfile = async (event) => {
  // Update user preferences
};
```

### 2. Dashboard & Analytics
```javascript
// GET /api/v1/dashboard/summary
exports.getDashboardSummary = async (event) => {
  // SELECT * FROM dashboard_summary view
  return {
    pending_count, reviewing_count, fraud_count,
    critical_count, avg_confidence, today_count
  };
};

// GET /api/v1/dashboard/statistics
exports.getDailyStatistics = async (event) => {
  // Date-range statistics with charts data
};
```

### 3. Complaint Management
```javascript
// GET /api/v1/complaints
exports.getComplaintsList = async (event) => {
  const { page, limit, status, category, urgency } = event.queryStringParameters;
  // Paginated list with filters
};

// GET /api/v1/complaints/{id}
exports.getComplaintDetails = async (event) => {
  return {
    complaint: {},  // Basic info
    messages: [],   // All messages
    summary: {},    // AI summary
    evidence: {},   // Evidence checklist
    comments: []    // Internal comments
  };
};

// PUT /api/v1/complaints/{id}/status
exports.updateComplaintStatus = async (event) => {
  // Update status + create audit log + notifications
};

// PUT /api/v1/complaints/{id}/assign
exports.assignComplaint = async (event) => {
  // Assign to user + notify assignee
};
```

### 4. AI & Processing
```javascript
// GET /api/v1/complaints/{id}/analysis
exports.getAIAnalysis = async (event) => {
  // Return AI analysis results
};

// POST /api/v1/complaints/{id}/reprocess
exports.reprocessComplaint = async (event) => {
  // Re-run AI analysis
};

// PUT /api/v1/complaints/{id}/summary
exports.updateSummary = async (event) => {
  // Manual summary editing
};
```

### 5. Editorial Workflow
```javascript
// GET /api/v1/editorial/pending-followups
exports.getPendingFollowups = async (event) => {
  // SELECT * FROM pending_followups view
};

// POST /api/v1/complaints/{id}/followups
exports.addJournalistFollowup = async (event) => {
  // Record journalist interview/investigation
};

// GET /api/v1/editorial/ready-for-editorial
exports.getReadyForEditorial = async (event) => {
  // Cases ready for editorial decision
};

// POST /api/v1/complaints/{id}/editorial-decision
exports.makeEditorialDecision = async (event) => {
  // Approve/reject for publication
};
```

### 6. Evidence & Documentation
```javascript
// GET /api/v1/complaints/{id}/evidence
exports.getEvidenceChecklist = async (event) => {
  // Evidence tracking status
};

// PUT /api/v1/complaints/{id}/evidence
exports.updateEvidenceStatus = async (event) => {
  // Update evidence completion status
};
```

### 7. Real-time Features
```javascript
// WebSocket handlers
exports.websocketConnect = async (event) => {
  // Store connection for real-time updates
};

exports.broadcastUpdate = async (event) => {
  // Send updates to connected clients
};
```

## Current Implementation Status

### Completed (Checkpoint #1)
- ✅ Project planning and architecture design
- ✅ Database schema design (comprehensive)
- ✅ LINE webhook handler (index.js)
- ✅ Session management (DynamoDB)
- ✅ Entity extraction (Thai language)
- ✅ Categorization rules
- ✅ Gemini AI integration
- ✅ Basic complaint creation workflow

### Current Implementation Files
```
├── index.js              # Main LINE webhook handler
├── sessionManager.js     # DynamoDB session management  
├── database.js          # PostgreSQL operations
├── entityExtractor.js   # Thai text entity extraction
├── categorizer.js       # Rule-based categorization
├── geminiAI.js         # Google Gemini integration
└── package.json        # Dependencies
```

### Key Features Working
1. **LINE Message Processing**: Receives and validates LINE webhooks
2. **Progressive Data Collection**: Builds conversation context over time
3. **Smart Complaint Creation**: Only creates complaints when criteria met
4. **Thai Language Support**: Optimized patterns for Thai text
5. **AI Analysis**: Entity extraction + categorization + Gemini summaries
6. **Database Transactions**: Safe data persistence

## Next Steps (Checkpoint #2)

### Backend Development
1. **Complete API Layer**: Implement all Lambda functions for frontend
2. **Authentication Integration**: Connect Cognito with RBAC
3. **Real-time Features**: WebSocket for live updates
4. **File Upload**: Handle evidence attachments
5. **Export Functions**: Generate reports and data exports

### Frontend Development
1. **Dashboard**: Summary statistics and metrics
2. **Complaint Management**: List, details, assignment interface
3. **Editorial Workflow**: Follow-up tracking, decision interface
4. **User Management**: Role-based access control
5. **Real-time Updates**: Live complaint status changes

### DevOps & Infrastructure
1. **CI/CD Pipeline**: GitHub Actions deployment
2. **Monitoring**: CloudWatch alerts and logging
3. **Performance Testing**: Load testing with concurrent users
4. **Security Audit**: Penetration testing and vulnerability assessment

### Quality Assurance
1. **AI Model Validation**: Test categorization accuracy
2. **Thai Language Testing**: Verify entity extraction patterns
3. **User Acceptance Testing**: Test with real Thai PBS staff
4. **PDPA Compliance**: Data privacy and consent workflows

## Development Guidelines

### Database Conventions
- Use UUID for all primary keys
- Include `created_at`/`updated_at` timestamps
- Use proper foreign key constraints
- Implement soft deletes where needed
- Add comprehensive indexes for query performance

### API Conventions
- RESTful endpoint design
- Consistent error response format
- Input validation on all endpoints
- Rate limiting and authentication
- Comprehensive logging

### Security Requirements
- Cognito JWT validation on all endpoints
- Role-based access control (RBAC)
- Input sanitization and SQL injection prevention
- HTTPS-only communication
- Audit logging for all data modifications

### Performance Targets
- API response time < 500ms (95th percentile)
- Real-time updates < 100ms latency
- Support 100+ concurrent users
- Database query optimization
- Lambda cold start mitigation

## Monitoring & Metrics

### Key Performance Indicators
- **Complaint Processing Time**: Submission to journalist assignment
- **AI Accuracy**: Category prediction vs manual verification
- **User Adoption**: Active users per role
- **Publication Rate**: Complaints leading to published content
- **System Availability**: 99.9% uptime target

### Alerts & Monitoring
- Database connection failures
- Lambda timeout errors
- High error rates (>5%)
- Unusual traffic patterns
- Failed LINE webhook deliveries

## Risk Management

### Technical Risks
- **AI Accuracy**: Thai language processing challenges
- **Scale**: LINE webhook volume spikes
- **Dependencies**: Third-party service outages
- **Data Loss**: Database backup and recovery

### Business Risks
- **PDPA Compliance**: Personal data handling
- **User Adoption**: Change management
- **Content Quality**: AI vs human judgment
- **Resource Constraints**: Development timeline

## Conclusion

The ScamReport system represents a comprehensive solution for automated complaint processing, designed specifically for Thai PBS's editorial workflow. The current implementation provides a solid foundation with sophisticated AI processing capabilities, while the planned backend API and frontend interface will complete the full user experience.

The system's strength lies in its progressive data collection approach, Thai language optimization, and comprehensive editorial workflow support. Success will depend on achieving high AI accuracy, seamless user experience, and reliable real-time operations.
