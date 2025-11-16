const CATEGORY_KEYWORDS = {
    fraud: [
      'หลอก', 'โกง', 'ฉ้อโกง', 'มิจฉาชีพ', 'โกงเงิน',
      'ลงทุนปลอม', 'แอพปลอม', 'พนันออนไลน์', 'forex'
    ],
    legal_issue: [
      'ทนายความ', 'คดีความ', 'ศาล', 'แจ้งความ', 'ตำรวจ'
    ],
    tip_off: [
      'แจ้งเบาะแส', 'พบเห็น', 'เห็นเหตุการณ์', 'เตือนภัย'
    ]
  };
  
  const URGENCY_KEYWORDS = {
    critical: ['ด่วนมาก', 'ฉุกเฉิน', 'อันตราย', 'ช่วยด้วย', 'กำลังโอน', 'ตอนนี้'],
    high: ['ด่วน', 'เร่งด่วน', 'เมื่อวาน', 'วันนี้', 'ผู้สูงอายุ'],
    medium: ['ช่วยหน่อย', 'สัปดาห์ที่แล้ว'],
    low: ['เดือนที่แล้ว', 'นานแล้ว']
  };
  
  /**
   * Categorize complaint
   */
  export function categorizeComplaint(text, entities) {
    const normalizedText = text.toLowerCase();
    const scores = { fraud: 0, legal_issue: 0, tip_off: 0 };
    
    // Calculate scores
    Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        const count = (normalizedText.match(new RegExp(keyword, 'g')) || []).length;
        scores[category] += count * 10;
      });
    });
    
    // Bonus for entities
    if (entities.amounts.length > 0 && entities.phones.length > 0) {
      scores.fraud += 15;
    }
    
    // Find highest score
    const maxScore = Math.max(...Object.values(scores));
    const category = Object.keys(scores).find(k => scores[k] === maxScore);
    
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? Math.min(100, Math.round((maxScore / totalScore) * 100)) : 0;
    
    return {
      category: confidence > 30 ? category : 'uncategorized',
      confidence,
      scores,
      keywords: CATEGORY_KEYWORDS[category] || []
    };
  }
  
  /**
   * Detect urgency level
   */
  export function detectUrgency(text, entities) {
    const normalizedText = text.toLowerCase();
    let urgencyScore = 0;
    
    // Keyword scoring
    Object.entries(URGENCY_KEYWORDS).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        if (normalizedText.includes(keyword)) {
          switch(level) {
            case 'critical': urgencyScore += 40; break;
            case 'high': urgencyScore += 25; break;
            case 'medium': urgencyScore += 10; break;
            case 'low': urgencyScore += 5; break;
          }
        }
      });
    });
    
    // Amount-based scoring
    const maxAmount = Math.max(...(entities.amounts || [0]));
    if (maxAmount >= 1000000) urgencyScore += 30;
    else if (maxAmount >= 500000) urgencyScore += 20;
    else if (maxAmount >= 100000) urgencyScore += 10;
    
    // Determine urgency level
    let urgencyLevel;
    if (urgencyScore >= 80) urgencyLevel = 'critical';
    else if (urgencyScore >= 50) urgencyLevel = 'high';
    else if (urgencyScore >= 25) urgencyLevel = 'medium';
    else urgencyLevel = 'low';
    
    return {
      urgencyLevel,
      urgencyScore: Math.min(100, urgencyScore)
    };
  }