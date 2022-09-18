
class Pointer<T> {

  // private _ptr: usize;

  // private constructor() { this._ptr = 0; }

  @inline init(ptr: usize = 0): void {
    // return changetype<Pointer<T>>(ptr);
  }

  // @inline get offset(): usize {
  //   return changetype<usize>(this);
  // }
}

export { Pointer };
