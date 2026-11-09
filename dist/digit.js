export const DIGITS = '0123456789abcdef';
export const createDigitValidator = (base) => (char) => char.length === 1 && DIGITS.slice(0, base).includes(char.toLowerCase());
