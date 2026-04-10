import crypto from 'crypto';

const SECRET_KEY = process.env.QR_SECRET_KEY || 'english-center-qr-secret-key-2024';

/**
 * Generate QR code string for attendance
 * Format: sessionId_timestamp_hash
 */
export const generateQRString = (sessionId: number): string => {
  const timestamp = Date.now();
  const hash = crypto
    .createHash('sha256')
    .update(`${sessionId}_${timestamp}_${SECRET_KEY}`)
    .digest('hex')
    .substring(0, 16); // Take first 16 chars of hash

  return `${sessionId}_${timestamp}_${hash}`;
};

/**
 * Validate and parse QR code string
 * @returns sessionId and timestamp, or null if invalid
 */
export const parseQRString = (qrString: string): { sessionId: number; timestamp: number } | null => {
  const parts = qrString.split('_');
  
  if (parts.length !== 3) {
    return null;
  }

  const [sessionIdStr, timestampStr, hash] = parts;
  const sessionId = parseInt(sessionIdStr);
  const timestamp = parseInt(timestampStr);

  if (isNaN(sessionId) || isNaN(timestamp)) {
    return null;
  }

  // Verify hash
  const expectedHash = crypto
    .createHash('sha256')
    .update(`${sessionId}_${timestamp}_${SECRET_KEY}`)
    .digest('hex')
    .substring(0, 16);

  if (hash !== expectedHash) {
    return null;
  }

  return { sessionId, timestamp };
};

/**
 * Check if QR code is expired (30 minutes)
 */
export const isQRExpired = (timestamp: number): boolean => {
  const now = Date.now();
  const expiryTime = timestamp + 30 * 60 * 1000; // 30 minutes in milliseconds
  return now > expiryTime;
};
