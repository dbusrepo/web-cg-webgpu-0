declare const pixel_count: i32;

export function clear_canvas(off: i32): void {
    const value = v128(0, 0, 0, <i8>255, 0, 0, 0, <i8>255, <i8>0x0, 0, 0, <i8>255, 0, 0, 0, <i8>255);
    const limit = pixel_count*4;
    for (let i: i32 = off; i != limit; i+=32) {
        v128.store(i, value);
        v128.store(i+16, value);
    }
}

// export function clear_canvas(off: i32): void {
//     const value = 0xff_00_00_00;
//     let limit = pixel_count*4;
//     for (let i: i32 = off; i != limit; i+=16) {
//         store<u32>(i, value);
//         store<u32>(i+4, value);
//         store<u32>(i+8, value);
//         store<u32>(i+12, value);
//     }
// }
