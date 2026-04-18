import axios from 'axios';
import API_CONFIG from '../config/apiConfig';

const TEXT_EXTS = [
  '.txt', '.md', '.csv', '.json', '.js', '.ts', '.jsx', '.tsx',
  '.py', '.html', '.htm', '.css', '.xml', '.log', '.java', '.c',
  '.cpp', '.php', '.rb', '.go', '.rs', '.sh', '.yaml', '.yml',
  '.toml', '.ini', '.sql', '.env', '.config', '.kt', '.swift',
];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function readFileForChat(file) {
  if (!file) return null;
  if (file.size > MAX_SIZE) throw new Error('File too large. Maximum size is 5 MB.');

  const nameLow = file.name.toLowerCase();
  const isImage = file.type.startsWith('image/');
  const isPdf   = file.type === 'application/pdf' || nameLow.endsWith('.pdf');
  const isText  = file.type.startsWith('text/') || TEXT_EXTS.some(e => nameLow.endsWith(e));

  if (isImage) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = e => resolve({ type: 'image', dataUrl: e.target.result, name: file.name, mimeType: file.type });
      r.onerror = () => reject(new Error('Failed to read image'));
      r.readAsDataURL(file);
    });
  }

  if (isText || isPdf) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = e => {
        let content = e.target.result;
        if (isPdf) content = extractPdfText(content);
        resolve({ type: 'text', content, name: file.name });
      };
      r.onerror = () => reject(new Error('Failed to read file'));
      // PDFs read as latin1 to preserve byte values for text extraction
      if (isPdf) r.readAsText(file, 'latin1');
      else r.readAsText(file);
    });
  }

  throw new Error('Unsupported file type. Upload images, text files, code files, or PDFs.');
}

function extractPdfText(raw) {
  // Best-effort: extract text between PDF BT/ET markers (Tj / TJ operators)
  const chunks = [];
  const tjRe = /\(([^)]{1,300})\)\s*Tj/g;
  const tjArrRe = /\[([^\]]*)\]\s*TJ/g;
  let m;

  while ((m = tjRe.exec(raw)) !== null) {
    const t = m[1].replace(/\\n/g, '\n').replace(/\\r/g, '').trim();
    if (t && isPrintable(t)) chunks.push(t);
  }

  while ((m = tjArrRe.exec(raw)) !== null) {
    // Extract strings inside parentheses in the array
    const inner = m[1];
    const arrRe = /\(([^)]{1,200})\)/g;
    let a;
    while ((a = arrRe.exec(inner)) !== null) {
      const t = a[1].trim();
      if (t && isPrintable(t)) chunks.push(t);
    }
  }

  if (chunks.length === 0) return '[PDF: Could not extract text. Try copying and pasting the content.]';
  return chunks.join(' ');
}

function isPrintable(str) {
  // Filter out strings that are mostly non-printable chars
  const printable = str.replace(/[^\x20-\x7e\n\r\t]/g, '').length;
  return printable / str.length > 0.6;
}

export function getFileIcon(name = '') {
  const n = name.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(n)) return 'image';
  if (n.endsWith('.pdf'))  return 'picture_as_pdf';
  if (n.endsWith('.csv') || n.endsWith('.xlsx')) return 'table_chart';
  if (n.endsWith('.json')) return 'data_object';
  if (/\.(py|js|ts|jsx|tsx|java|c|cpp|go|rb|php|sh)$/.test(n)) return 'code';
  if (n.endsWith('.md'))   return 'article';
  if (n.endsWith('.sql'))  return 'storage';
  return 'description';
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Call the backend vision endpoint for image analysis
export async function analyzeImageWithVision(messages, systemPrompt, imageDataUrl) {
  const res = await axios.post(`${API_CONFIG.AI_BASE_URL}/api/v1/ai/vision`, {
    messages,
    systemPrompt,
    imageBase64: imageDataUrl,
    maxTokens: 1024,
  });
  if (!res.data?.success) throw new Error(res.data?.message || 'Vision analysis failed');
  return res.data.reply;
}
