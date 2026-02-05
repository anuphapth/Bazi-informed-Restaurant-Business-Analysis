import dotenv from 'dotenv'
dotenv.config()
const BASE62 = process.env.BASE62;
const BASE = 62n;
const SECRET = 0x5f3759dfn;

export const encodeShort = (id) => {
    if (!Number.isInteger(id) || id < 0) {
        throw new Error("id must be a positive integer");
    }

    let num = BigInt(id) ^ SECRET;

    let result = "";
    do {
        result = BASE62[num % BASE] + result;
        num /= BASE;
    } while (num > 0n);

    return result.padStart(8, "0");
};

export const decodeShort = (code) => {
    if (typeof code !== "string" || code.length !== 8) return null;

    let num = 0n;
    for (const ch of code) {
        const idx = BASE62.indexOf(ch);
        if (idx === -1) return null;
        num = num * BASE + BigInt(idx);
    }
    const id = num ^ BigInt(SECRET);

    return Number(id);
};
