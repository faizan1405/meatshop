import { faqs } from '@/data/faqs';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into',
  'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then',
  'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with', 'what', 'why', 'how',
  'when', 'where', 'who', 'do', 'can', 'does', 'did', 'i', 'my', 'we', 'our', 'you', 'your'
]);

function tokenize(text) {
  if (!text) return [];
  // Remove punctuation, lowercase, split by whitespace, and filter stop words
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

export function matchFaq(userQuestion) {
  if (!userQuestion || userQuestion.trim().length === 0) {
    return null;
  }

  const queryTokens = tokenize(userQuestion);
  if (queryTokens.length === 0) {
    return null;
  }

  const scoredFaqs = faqs.map(faq => {
    let score = 0;
    const questionTokens = tokenize(faq.question);
    const answerTokens = tokenize(faq.answer);
    const categoryTokens = tokenize(faq.category);
    const keywords = faq.keywords.map(k => k.toLowerCase());

    // Exact phrase match in keywords gives a huge boost
    const normalizedUserQuestion = userQuestion.toLowerCase().trim();
    if (keywords.some(k => normalizedUserQuestion.includes(k))) {
      score += 15;
    }

    // Token matching
    queryTokens.forEach(token => {
      // Keyword match (highest weight)
      if (keywords.some(k => k.includes(token))) {
        score += 5;
      }
      
      // Question match
      if (questionTokens.includes(token)) {
        score += 3;
      }

      // Category match
      if (categoryTokens.includes(token)) {
        score += 2;
      }
      
      // Answer match
      if (answerTokens.includes(token)) {
        score += 1;
      }
    });

    return { faq, score };
  });

  // Sort by score descending
  scoredFaqs.sort((a, b) => b.score - a.score);

  const bestMatch = scoredFaqs[0];

  // Threshold to ensure we don't return unrelated answers
  // If we found at least 1 keyword match or a few good token matches
  const THRESHOLD = 4;

  if (bestMatch && bestMatch.score >= THRESHOLD) {
    return bestMatch.faq;
  }

  return null;
}
