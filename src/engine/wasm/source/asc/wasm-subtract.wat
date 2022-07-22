(module
 (type $i32_i32_=>_i32 (func (param i32 i32) (result i32)))
 (import "env" "memory" (memory $0 (shared 80 80)))
 (export "subtract" (func $wasm-subtract/subtract))
 (export "memory" (memory $0))
 (func $wasm-subtract/subtract (param $0 i32) (param $1 i32) (result i32)
  local.get $0
  local.get $1
  i32.sub
 )
)
