# https://stackoverflow.com/questions/3871444/making-all-rules-depend-on-the-makefile-itself
.EXTRA_PREREQS:= $(abspath $(lastword $(MAKEFILE_LIST)))

TARGET_DEBUG := debug
TARGET_SPEED := release-speed
TARGET_SIZE := release-size
TARGET ?= $(TARGET_DEBUG)

ASC_CONFIG_FILE := asconfig.json
ASC_SOURCE_DIR := src/asc
ASC_BUILD_DIR := build/asc
ASC_SOURCE_FILES := $(wildcard $(ASC_SOURCE_DIR)/*.ts)
ASC_BUILD_FILES := $(ASC_SOURCE_FILES:$(ASC_SOURCE_DIR)/%.ts=$(ASC_BUILD_DIR)/%.wasm)
ASC_BINDINGS = esm

# SOURCE_WAT_FILES = $(wildcard $(SOURCE_DIR)/wat/*.wat)

WAT_SOURCE_DIR := src/wat
WAT_BUILD_DIR := build/wat
WAT_SOURCE_FILES := $(wildcard $(WAT_SOURCE_DIR)/*.wat)
WAT_BUILD_FILES := $(WAT_SOURCE_FILES:$(WAT_SOURCE_DIR)/%.wat=$(WAT_BUILD_DIR)/%.wasm)
WAT_2_WASM_FLAGS := --disable-mutable-globals --enable-threads --enable-tail-call
WASM_OPT_FLAGS := --zero-filled-memory --all-features --disable-mutable-globals --disable-gc --disable-exception-handling
WASM_OPT_SPEED:= --converge --dce -O3 $(WASM_OPT_FLAGS)
WASM_OPT_SIZE:= --converge --dce -Oz $(WASM_OPT_FLAGS)
WASM_OPT_DEBUG:= -O --debuginfo $(WASM_OPT_FLAGS)


.PHONY: all build_asc build_wat clean force

all: build_asc build_wat

build_flags: force
	@echo '$(TARGET)' | cmp -s - $@ || echo '$(TARGET)' > $@

# **************************************************
# COMPILE ASC
# **************************************************

build_asc: init_asc_build $(ASC_BUILD_FILES)
	@echo
	@echo 'Asc files compilation terminated.'

init_asc_build:
	@echo $(MAKEFILE_LIST)
	@echo 'Compiling asc files...'
	@mkdir -p $(ASC_BUILD_DIR)

$(ASC_BUILD_DIR)/%.wasm: $(ASC_SOURCE_DIR)/%.ts build_flags $(ASC_CONFIG_FILE)
	@echo
	@echo Compiling $@ ...
	asc --config $(ASC_CONFIG_FILE) $< -o $@ -t $(basename $@).wat -b $(ASC_BINDINGS) --target $(TARGET)

# **************************************************
# COMPILE WAT
# **************************************************

build_wat: init_wat_build $(WAT_BUILD_FILES)
	@echo
	@echo 'Wat files compilation terminated.'

init_wat_build:
	@echo
	@echo 'Compiling Wat files...'
	@mkdir -p $(WAT_BUILD_DIR)

$(WAT_BUILD_DIR)/%.wasm: $(WAT_SOURCE_DIR)/%.wat build_flags
	@echo
	@echo Compiling $@ ...
	wat2wasm $< $(WAT_2_WASM_FLAGS) -o $@
ifeq ($(TARGET), $(TARGET_SPEED))
	wasm-opt $@ -o $@ $(WASM_OPT_SPEED)
else ifeq ($(TARGET), $(TARGET_SIZE))
	wasm-opt $@ -o $@ $(WASM_OPT_SIZE)
else
	wasm-opt $@ -o $@ $(WASM_OPT_DEBUG)
endif

clean-asc:
	rm -rf ./build/asc

clean-wat:
	rm -rf ./build/wat

clean:
	rm -rf ./build/

# SOURCE_ASC_PATHS = $(wildcard $(SOURCE_DIR)/asc/*.ts)
# SOURCE_ASC_NAMES = $(notdir $(SOURCE_ASC_PATHS))
# BUILD_ASC_TO_WASM_NAMES = $(SOURCE_ASC_NAMES:.ts=.wasm)
# BUILD_ASC_TO_WASM = $(addprefix $(BUILD_DIR)/asc/, $(BUILD_ASC_TO_WASM_NAMES))
