// eslint-disable-next-line github/filenames-match-regex
declare module '*.wasm' {
  function wasmBuilderFunc<T>(
    importsObject?: WebAssembly.Imports,
  ): Promise<{ instance: WebAssembly.Instance & { exports: T } }>;
  export = wasmBuilderFunc;
}

declare module '*.png' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any;
  export default content;
}

declare module '*.txt' {
  const content: string;
  export default content;
}

// declare module '*.res' {
//   const content: string;
//   export default content;
// }
