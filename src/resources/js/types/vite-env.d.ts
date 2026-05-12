/// <reference types="vite/client" />

declare function route(
    name: string,
    params?: Record<string, unknown> | string | number | Array<unknown>,
    absolute?: boolean,
): string;
