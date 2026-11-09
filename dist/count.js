const cache = new Map();
export const countPossibleSecrets = (length, base) => {
    if (length < 0 || base < 0 || length > base || !Number.isInteger(length) || !Number.isInteger(base))
        return 0;
    if (length === 0)
        return 1;
    const key = `${length}:${base}`;
    if (!cache.has(key))
        cache.set(key, base * countPossibleSecrets(length - 1, base - 1));
    return cache.get(key);
};
