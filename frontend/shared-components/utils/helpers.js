export function downloadPdf(blobData) {
  const url = window.URL.createObjectURL(new Blob([blobData]), { type: "application/pdf" });
  const a = document.createElement("A");
  a.setAttribute("download", "impacts.pdf");
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadFile(blobData, fileName) {
  const url = window.URL.createObjectURL(blobData);
  const a = document.createElement("A");
  a.setAttribute("download", fileName);
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function downloadFileFromUrl(url) {
  const a = document.createElement("A");
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function downloadImage(base64, title = "chart.png") {
  const a = document.createElement("A");
  a.setAttribute("download", title);
  a.href = base64;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const navigator = window.navigator || {};

const fallbackCopyTextToClipboard = async text => {
  const textArea = document.createElement('input');
  textArea.setAttribute('type', 'hidden');
  textArea.style = { visibility: 'hidden' };
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, 99999);

  try {
    const successful = document.execCommand('copy');
    const msg = successful ? 'successful' : 'unsuccessful';
    return msg;
  } catch (err) {
    console.err('Unable to copy to clipboard'); //eslint-disable-line
  }

  document.body.removeChild(textArea); //eslint-disable-line
  return 'success';
};

export const copyToClipboard = text => {
  if (!navigator.clipboard) {
    return fallbackCopyTextToClipboard(text);
  }
  return navigator.clipboard.writeText(text);
};

export const smallerImage = (image, size = 96) => {
  if (image) {
    const insertionPoint = image.indexOf('/upload') + 8;
    const transformation = `w_${size},h_${size}`
    return image.substring(0, insertionPoint) + transformation + image.substring(insertionPoint - 1);
  }

  return null;
}

export const arraySum = arr => arr.reduce((acc, curr) => acc + Number(curr), 0);

export const arrayCumulative = arr => arr.reduce((acc, current, index) => {
  if (index === 0) {
    acc.push(+current);
  } else {
    acc.push(+acc[index - 1] + +current);
  }
  return acc;
}, []);

export const capitalize = (val) => {
  return val.substring(0, 1).toUpperCase() + val.substring(1).toLowerCase();
};

export const formatFileSize = (bytes) => {
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i;
  for (i = 0; bytes >= 1024 && i < units.length - 1; i++) {
    bytes /= 1024;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

export const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ESG Risk Score Utilities
export const getESGRiskLevel = (score, isTotal = false) => {
  if (score === null || score === undefined) return 'N/A';
  
  if (isTotal) {
    // Total score (0-30 scale)
    if (score <= 9) return 'Low';
    if (score <= 14) return 'Medium';
    if (score <= 19) return 'High';
    return 'Severe';
  } else {
    // Individual dimension score (0-10 scale)
    if (score <= 3) return 'Low';
    if (score <= 6) return 'Medium';
    return 'High';
  }
};

export const getESGRiskColor = (score, isTotal = false) => {
  if (score === null || score === undefined) return '#999999'; // Gray - No Data
  
  if (isTotal) {
    // Total score (0-30 scale)
    if (score <= 9) return '#4caf50'; // Green - Low Risk
    if (score <= 14) return '#ff9800'; // Orange - Medium Risk
    if (score <= 19) return '#f44336'; // Red - High Risk
    return '#d32f2f'; // Dark Red - Severe Risk
  } else {
    // Individual dimension score (0-10 scale)
    if (score <= 3) return '#4caf50'; // Green - Low Risk
    if (score <= 6) return '#ff9800'; // Orange - Medium Risk
    return '#f44336'; // Red - High Risk
  }
};

export const formatESGScore = (score) => {
  if (score === null || score === undefined) return 'N/A';
  return score.toFixed(1);
};
