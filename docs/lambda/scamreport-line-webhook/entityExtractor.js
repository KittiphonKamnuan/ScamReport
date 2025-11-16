/**
 * Extract entities from Thai text
 */
export function extractEntities(text) {
    if (!text) {
      return {
        amounts: [],
        phones: [],
        urls: [],
        bankAccounts: [],
        lineIds: []
      };
    }
    
    const entities = {
      amounts: [],
      phones: [],
      urls: [],
      bankAccounts: [],
      lineIds: []
    };
    
    // Extract amounts
    const amountPatterns = [
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:บาท|baht|THB|฿)/gi,
      /฿\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d+)\s*(?:ล้าน)/gi,
      /(\d+)\s*(?:แสน)/gi,
      /(\d+)\s*(?:หมื่น)/gi,
      /(\d+)\s*(?:พัน)/gi
    ];
    
    amountPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        
        // Convert Thai number words
        if (text.includes('ล้าน')) amount *= 1000000;
        else if (text.includes('แสน')) amount *= 100000;
        else if (text.includes('หมื่น')) amount *= 10000;
        else if (text.includes('พัน')) amount *= 1000;
        
        if (amount > 0) {
          entities.amounts.push(amount);
        }
      }
    });
    
    // Extract phone numbers
    const phonePattern = /0[689]\d{8}/g;
    const phoneMatches = text.match(phonePattern);
    if (phoneMatches) {
      entities.phones.push(...phoneMatches);
    }
    
    // Extract URLs
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urlMatches = text.match(urlPattern);
    if (urlMatches) {
      entities.urls.push(...urlMatches);
    }
    
    // Extract LINE IDs
    const lineIdPattern = /(?:LINE ID|ไลน์)\s*[:：]?\s*([a-zA-Z0-9._-]+)/gi;
    const lineIdMatches = text.matchAll(lineIdPattern);
    for (const match of lineIdMatches) {
      entities.lineIds.push(match[1]);
    }
    
    // Deduplicate
    entities.amounts = [...new Set(entities.amounts)];
    entities.phones = [...new Set(entities.phones)];
    entities.urls = [...new Set(entities.urls)];
    entities.lineIds = [...new Set(entities.lineIds)];
    
    return entities;
  }