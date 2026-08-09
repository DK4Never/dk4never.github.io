export const DOCUMENT_IDS = ['page-one', 'executive', 'ats', 'technical-profile'];
export const isDocumentId = (value) => typeof value === 'string' && DOCUMENT_IDS.includes(value);
