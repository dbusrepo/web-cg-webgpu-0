# https://stackoverflow.com/questions/3871444/making-all-rules-depend-on-the-makefile-itself
.EXTRA_PREREQS:= $(abspath $(lastword $(MAKEFILE_LIST)))

IMAGES_DIR := ./images
IMAGES_SCRIPT := $(IMAGES_DIR)/preprocImagesList.mjs
IMAGES_IN := $(IMAGES_DIR)/images.res
IMAGES_OUT := $(IMAGES_DIR)/imagesList.ts

.PHONY: clean-images-out

$(IMAGES_OUT): $(IMAGES_IN) $(IMAGES_SCRIPT)
	$(info GEN $@)
	node $(IMAGES_SCRIPT) $< $@

clean-images-out:
	rm -f $(IMAGES_OUT)

clean: clean-images-out
