
export const TARGET_EXT = [
    'zip',
    'pdf',
]

export const MODE = {
    none: 0,
    zip: 1,
    pdf: 2,
} as const;

export type MODE = typeof MODE[keyof typeof MODE];

export const IMAGE_EXT = {
    none: 0,
    bmp: 1,
    png: 2,
    jpg: 3,
    jpeg: 3,
    webp: 4,
    avif: 5,
} as const;

export type IMAGE_EXT = typeof IMAGE_EXT[keyof typeof IMAGE_EXT];
