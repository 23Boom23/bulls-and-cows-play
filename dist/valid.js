import { createDigitValidator } from './digit.js';
export const isValidGuess = (guess, length, base) => {
    const digits = [...guess.toLowerCase()];
    return digits.length === length && new Set(digits).size === length && digits.every(createDigitValidator(base));
};
