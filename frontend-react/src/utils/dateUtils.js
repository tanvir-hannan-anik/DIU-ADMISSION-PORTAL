// Bangladesh Standard Time (BST = UTC+6, Asia/Dhaka)
const BST = 'Asia/Dhaka';

export const formatBSTDate = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-BD', { timeZone: BST, year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatBSTDateTime = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-BD', {
    timeZone: BST,
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

export const nowBST = () => {
  return new Date().toLocaleString('en-BD', { timeZone: BST });
};

export const nowISOBST = () => new Date().toISOString();
