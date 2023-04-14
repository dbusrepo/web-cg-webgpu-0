(module
  (global $canvas_width (import "env" "canvas_width") i32)
  (global $canvas_height (import "env" "canvas_height") i32)
  (global $pixel_count (import "env" "pixel_count") i32)
  (import "env" "buffer" (memory 512 512 shared))

  (; (import "env" "buffer" (memory 80)) ;)

  ;; clear the entire canvas
  (func $clear_canvas
        (local $i i32) 
        (local $count i32)

        global.get $pixel_count
        local.set $count

        (loop $clear_loop
              local.get $i
              i32.const 0xff_00_00_00
              i32.store

              local.get $i
              i32.const 4
              i32.add
              local.set $i

              local.get $count
              i32.const 1
              i32.sub
              local.tee $count
              br_if $clear_loop
              )
        )

  (export "clear_canvas" (func $clear_canvas))

  )


