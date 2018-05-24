// flow-typed signature: f116e8640d65663fbd0f4e1f2a472787
// flow-typed version: 1165abc018/ms_v2.x.x/flow_>=v0.25.0

declare module 'ms' {
    declare type Options = { long?: boolean };

    declare module.exports: {
        (val: string, options?: Options): number,
        (val: number, options?: Options): string,
    };
}
