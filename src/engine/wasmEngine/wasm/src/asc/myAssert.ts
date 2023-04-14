export function myAssert(e: boolean): void {
  if (!e) {
    unreachable();
  }
}
