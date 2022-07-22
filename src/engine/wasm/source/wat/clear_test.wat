(module
  (; (global $canvas_width (import "env" "canvas_width") i32) ;)
  (; (global $canvas_height (import "env" "canvas_height") i32) ;)

  (; (import "env" "buffer" (memory 80)) ;)

  ;; clear the entire canvas
  (func $clear_test (result i32)
        (local $i i32) 
        (local $pixel_bytes i32)
        i32.const 14
  )

  (export "clear_test" (func $clear_test))
)



