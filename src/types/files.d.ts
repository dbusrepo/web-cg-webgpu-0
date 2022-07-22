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
