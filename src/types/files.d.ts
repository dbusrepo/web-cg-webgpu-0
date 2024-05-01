declare module '*.wasm' {
  function wasmBuilderFunc<T>(
    importsObject?: WebAssembly.Imports,
  ): Promise<{ instance: WebAssembly.Instance & { exports: T } }>;
  export = wasmBuilderFunc;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.txt' {
  const content: string;
  export default content;
}

declare module '*.wgsl' {
  const content: string;
  export default content;
}

// declare module '*.glsl';
// declare module '*.vs';
// declare module '*.fs';

// declare module '*.res' {
//   const content: string;
//   export default content;
// }
