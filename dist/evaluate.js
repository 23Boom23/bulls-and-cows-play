export const evaluateGuess = (secret, guess) => {
    const target = [...secret.toLowerCase()];
    const input = [...guess.toLowerCase()];
    const bulls = input.filter((digit, index) => digit === target[index]).length;
    return { bulls, cows: input.filter((digit) => target.includes(digit)).length - bulls };
};
