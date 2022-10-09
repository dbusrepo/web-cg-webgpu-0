# https://stackoverflow.com/questions/3871444/making-all-rules-depend-on-the-makefile-itself
.EXTRA_PREREQS:= $(abspath $(lastword $(MAKEFILE_LIST)))

ASC_DIR := ../engine/wasm/src/asc

IMAGES_DIR := ./images
IMAGES_SCRIPT := $(IMAGES_DIR)/preprocImagesList.mjs
IMAGES_IN := $(IMAGES_DIR)/images.res
IMAGES_OUT_TS := $(IMAGES_DIR)/imagesList.ts
IMAGES_OUT_TS_ASC := $(ASC_DIR)/importImages.ts

STRINGS_DIR := ./strings
STRINGS_SCRIPT := $(STRINGS_DIR)/preprocSringsList.mjs
STRINGS_IN := $(STRINGS_DIR)/strings.res
STRINGS_OUT_TS := $(STRINGS_DIR)/strings.ts
STRINGS_OUT_TS_ASC := $(ASC_DIR)/importStrings.ts

.PHONY: clean-images-out clean-strings-out

all: $(IMAGES_OUT_TS) $(IMAGES_OUT_TS_ASC) $(STRINGS_OUT_TS) $(STRINGS_OUT_TS_ASC)

$(IMAGES_OUT_TS) $(IMAGES_OUT_TS_ASC): $(IMAGES_IN) $(IMAGES_SCRIPT)
	node $(IMAGES_SCRIPT) $(IMAGES_IN) $(IMAGES_OUT_TS) $(IMAGES_OUT_TS_ASC)

$(STRINGS_OUT_TS) $(STRINGS_OUT_TS_ASC): $(STRINGS_IN) $(STRINGS_SCRIPT)
	node $(STRINGS_SCRIPT) $(STRINGS_IN) $(STRINGS_OUT_TS) $(STRINGS_OUT_TS_ASC)

clean-images-out:
	rm -f $(IMAGES_OUT_TS) $(IMAGES_OUT_TS_ASC)

clean-strings-out:
	rm -f $(STRINGS_OUT_TS) $(STRINGS_OUT_TS_ASC)

clean: clean-images-out clean-strings-out
