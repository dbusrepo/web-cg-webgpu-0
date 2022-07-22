(module
 (type $i32_=>_none (func (param i32)))
 (import "env" "memory" (memory $0 (shared 80 80)))
 (import "clear_bckgr" "pixel_count" (global $clear_bckgr/pixel_count i32))
 (export "clear_canvas" (func $clear_bckgr/clear_canvas))
 (export "memory" (memory $0))
 (func $clear_bckgr/clear_canvas (param $0 i32)
  (local $1 v128)
  (local $2 i32)
  v128.const i32x4 0xff000000 0xff000000 0xff000000 0xff000000
  local.set $1
  global.get $clear_bckgr/pixel_count
  i32.const 2
  i32.shl
  local.set $2
  loop $for-loop|0
   local.get $0
   local.get $2
   i32.ne
   if
    local.get $0
    local.get $1
    v128.store
    local.get $0
    local.get $1
    v128.store offset=16
    local.get $0
    i32.const 32
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
 )
)
