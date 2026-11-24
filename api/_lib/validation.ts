import type { ApiErrorResponse, GuestbookCreateInput } from '../../src/types/heritage';

const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;
const ANGLE_BRACKETS_RE = /[<>]/g;

export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(CONTROL_CHARS_RE, ' ')
    .replace(ANGLE_BRACKETS_RE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function validateGuestbookInput(raw: unknown): {
  valid: boolean;
  data?: GuestbookCreateInput;
  error?: ApiErrorResponse;
} {
  if (!raw || typeof raw !== 'object') {
    return {
      valid: false,
      error: { error: 'Dữ liệu gửi lên không hợp lệ.' },
    };
  }

  const record = raw as Record<string, unknown>;
  const author = sanitizeText(record.author, 80);
  const roleOrAffiliation = sanitizeText(record.roleOrAffiliation, 100) || 'Khách tham quan';
  const message = sanitizeText(record.message, 500);

  const fieldErrors: NonNullable<ApiErrorResponse['fieldErrors']> = {};

  if (author.length < 2) {
    fieldErrors.author = 'Họ và tên cần tối thiểu 2 ký tự.';
  }
  if (message.length < 5) {
    fieldErrors.message = 'Lời chúc cần tối thiểu 5 ký tự.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      valid: false,
      error: {
        error: 'Vui lòng kiểm tra lại thông tin lời chúc.',
        fieldErrors,
      },
    };
  }

  return {
    valid: true,
    data: {
      author,
      roleOrAffiliation,
      message,
    },
  };
}
