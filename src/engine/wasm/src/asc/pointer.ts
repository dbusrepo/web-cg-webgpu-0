@final @unmanaged class Pointer<T> {

  @inline constructor(offset: usize = 0) {
    return changetype<Pointer<T>>(offset);
  }

  @inline get offset(): usize {
    return changetype<usize>(this);
  }

  @inline get value(): T {
    if (isReference<T>()) {
      return changetype<T>(changetype<usize>(this));
    } else {
      return load<T>(changetype<usize>(this));
    }
  }

  @inline set value(value: T) {
    if (isReference<T>()) {
      if (isManaged<T>()) ERROR("Unsafe unmanaged set of a managed object");
      if (value == null) {
        memory.fill(changetype<usize>(this), 0, offsetof<T>());
      } else {
        memory.copy(changetype<usize>(this), changetype<usize>(value), offsetof<T>());
      }
    } else {
      store<T>(changetype<usize>(this), value);
    }
  }

  // FIXME: in general, inlining any of the following always yields a block. one could argue that
  // this helps debuggability, or that it is unnecessary overhead due to the simplicity of the
  // functions. a compromise could be to inline a block consisting of a single 'return' as is,
  // where possible.

  @inline @operator("+") add(other: Pointer<T>): Pointer<T> {
    return changetype<Pointer<T>>(changetype<usize>(this) + changetype<usize>(other));
  }

  @inline @operator("-") sub(other: Pointer<T>): Pointer<T> {
    return changetype<Pointer<T>>(changetype<usize>(this) - changetype<usize>(other));
  }

  @inline @operator.prefix("++") inc(): Pointer<T> {
    // FIXME: this should take alignment into account, but then would require a new builtin to
    // determine the minimal alignment of a struct by evaluating its field layout.
    const size = isReference<T>() ? offsetof<T>() : sizeof<T>();
    return changetype<Pointer<T>>(changetype<usize>(this) + size);
  }

  @inline @operator.prefix("--") dec(): Pointer<T> {
    const size = isReference<T>() ? offsetof<T>() : sizeof<T>();
    return changetype<Pointer<T>>(changetype<usize>(this) - size);
  }

  @inline @operator("[]") get(index: i32): T {
    const size = isReference<T>() ? offsetof<T>() : sizeof<T>();
    return load<T>(changetype<usize>(this) + (<usize>index * size));
  }

  @inline @operator("[]=") set(index: i32, value: T): void {
    const size = isReference<T>() ? offsetof<T>() : sizeof<T>();
    store<T>(changetype<usize>(this) + (<usize>index * size), value);
  }
}

export { Pointer };
