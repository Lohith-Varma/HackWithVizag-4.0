const INDIAN_PHONE_PATTERN = /^[6-9]\d{9}$/;
const HARMLESS_PHONE_FORMATTING_PATTERN = /^[+\d\s()-]+$/;

export const normalizeIndianPhone = (value) => {
  if (value === undefined || value === null) return "";
  const input = String(value).trim();
  if (!input || !HARMLESS_PHONE_FORMATTING_PATTERN.test(input)) return input;

  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
};

export const isValidIndianPhone = (value) => INDIAN_PHONE_PATTERN.test(normalizeIndianPhone(value));

