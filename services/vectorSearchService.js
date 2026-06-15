// TF-IDF & Cosine Similarity local Vector Search Engine

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its', 'itself', 'more', 'most', 'mustnt', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'wasnt', 'we', 'were', 'werent', 'what', 'when', 'where', 'which', 'while', 'who',
  'whom', 'why', 'with', 'wont', 'would', 'wouldnt', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

// Tokenize text into words
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

// Compute Term Frequency (TF) vector for a document
function computeTF(tokens, vocabulary) {
  const tf = {};
  vocabulary.forEach(word => {
    tf[word] = 0;
  });
  tokens.forEach(token => {
    if (token in tf) {
      tf[token]++;
    }
  });
  const totalTokens = tokens.length;
  if (totalTokens > 0) {
    vocabulary.forEach(word => {
      tf[word] = tf[word] / totalTokens;
    });
  }
  return tf;
}

// Compute Inverse Document Frequency (IDF) for vocabulary
function computeIDF(documents, vocabulary) {
  const idf = {};
  const N = documents.length;
  vocabulary.forEach(word => {
    let df = 0;
    documents.forEach(doc => {
      if (doc.tokens.includes(word)) {
        df++;
      }
    });
    // IDF formula with smoothing to avoid divide-by-zero
    idf[word] = Math.log(1 + (N / (df || 1)));
  });
  return idf;
}

// Calculate the vector (TF * IDF) as an array of numbers
export function buildDocVectors(articles) {
  // 1. Tokenize all articles
  const docs = articles.map(art => ({
    id: art._id,
    title: art.title,
    text: art.text,
    tokens: tokenize(art.title + " " + art.text + " " + (art.tags || []).join(" "))
  }));

  // 2. Build global vocabulary
  const vocabSet = new Set();
  docs.forEach(doc => {
    doc.tokens.forEach(token => vocabSet.add(token));
  });
  const vocabulary = Array.from(vocabSet);

  // 3. Compute IDF
  const idf = computeIDF(docs, vocabulary);

  // 4. Compute TF-IDF vectors for documents
  const vectorMap = docs.map(doc => {
    const tf = computeTF(doc.tokens, vocabulary);
    const vector = vocabulary.map(word => tf[word] * idf[word]);
    return {
      id: doc.id,
      title: doc.title,
      text: doc.text,
      vector
    };
  });

  return { vocabulary, idf, vectorMap };
}

// Compute Cosine Similarity between two numeric vectors
export function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Project a query string into the vector space and search for matches
export function queryVectorSimilarity(queryString, vocabulary, idf, docVectors) {
  const queryTokens = tokenize(queryString);
  const queryTF = computeTF(queryTokens, vocabulary);
  const queryVector = vocabulary.map(word => queryTF[word] * idf[word]);

  const results = docVectors.map(doc => {
    const similarity = cosineSimilarity(queryVector, doc.vector);
    return {
      id: doc.id,
      title: doc.title,
      text: doc.text,
      score: parseFloat(similarity.toFixed(4))
    };
  });

  // Sort by highest similarity score
  return results.sort((a, b) => b.score - a.score);
}
