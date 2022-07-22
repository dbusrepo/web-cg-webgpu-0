// ****** WASM IMPORT (wasm built from wat)
// import clear_canvas_wasm from './wasm/build/wat/clear_canvas.wasm';

// import clear_test_wasm from './wasm/bin/clear_test.wasm';

// ****** ASC/WASM IMPORT

// wasmBuilder for https://github.com/ballercat/wasm-loader webpack loader
// import adderWasm from './wasm/bin/wasm-adder.wasm';
// Following the example here https://www.assemblyscript.org/loader.html#typescript-definitions
// import type AdderModule from './wasm/assemblyscript/types-wasm-adder'

// another asc module here...
// import subtractWasm from './wasm/bin/wasm-subtract.wasm';
// import type SubtractModule from './wasm/assemblyscript/types-wasm-subtract'


// this.image_data.data.set(this.canvas_mem_i8c); // not useful here!?

// trying another way to optimize the copy in render method...but it's not
// that faster, we can't avoid the copy indeed
// this.canvas_i32 = new Uint32Array(memory.buffer, canvas_off, pixel_count);
// this.image_data = new ImageData(w, h);
// this.canvas_arr = new Uint32Array(this.image_data.data.buffer);
// this.canvas_arr!.set(this.canvas_i32);  <-- and put this in render()
// before putImageData

// another exp here:
// if the buffer is not shared this is one is sufficient, along with
// putimg in render()
// this.image_data = new ImageData(this.canvas_mem_i8c, w, h);

// (async () => {
//   // let obj = await WebAssembly.instantiateStreaming(fetch('./wasm/clear_canvas.wasm'), importObject);
//   // console.log((<Function>obj.instance.exports.clear_canvas)());
// **
// let obj = await wasm(importObject);
// const clear_canvas = <Function>obj.instance.exports.clear_canvas;
// console.log("hello from wasm " + clear_canvas());

// const obj = await clear_canvas_wasm(importObject);
// this.clear_canvas_native = <Function>obj.instance.exports.clear_canvas;

// console.log("hello from wasm " + clear_canvas());
//
// obj = await clear_test_wasm(importObject);
// console.log("hello from wasm2 " + (<Function>obj.instance.exports.clear_test)());
//
// obj = await adderWasm(importObject);
// console.log("(wasm) 1 + 2 == " + (<Function>obj.instance.exports.add)(1,2));
//
// obj = await subtractWasm(importObject);
// console.log("(wasm) 5 - 2 == " + (<Function>obj.instance.exports.subtract)(5,2));

// try to load asc module
// console.log('calling: ' + fun(3));
// console.log("(wasm) 5 - 2 == " + (<Function>obj.instance.exports.subtract)(5,2));
// })();
// (async () => {
//  let obj = await WebAssembly.instantiateStreaming(fetch('./wasm/clear_canvas.wasm'), importObject);
//  this.clear_wasm = <Function>obj.instance.exports.clear_canvas;
// })();

// wasmBuilder<typeof AdderModule>({
//     env: {
//         memory: new WebAssembly.Memory({ initial: 1}),
//         abort: () => {}
//     }
// }).then(wasm => {
//     const Adder = wasm.instance.exports;
//     const results = Adder.add(1, 2);
//     console.log('Huzzah! 1 + 2 = ' + results)
// });

