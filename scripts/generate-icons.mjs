import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i += 1) {
        c ^= buf[i];
        for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return ~c >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
}

function png(size, r, g, b) {
    const raw = Buffer.alloc((size * 3 + 1) * size);
    for (let y = 0; y < size; y += 1) {
        const row = y * (size * 3 + 1);
        raw[row] = 0;
        for (let x = 0; x < size; x += 1) {
            const inset = Math.floor(size * 0.18);
            const inside = x >= inset && x < size - inset && y >= inset && y < size - inset;
            const o = row + 1 + x * 3;
            raw[o] = inside ? r : 15;
            raw[o + 1] = inside ? g : 17;
            raw[o + 2] = inside ? b : 21;
        }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk("IHDR", ihdr),
        chunk("IDAT", deflateSync(raw)),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

mkdirSync(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
    writeFileSync(join(outDir, `icon-${size}.png`), png(size, 255, 235, 14));
}
