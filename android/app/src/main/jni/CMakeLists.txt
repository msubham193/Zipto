cmake_minimum_required(VERSION 3.13)

project(Zipto)

# Fix Folly dynamic.h template deduction error on Windows with NDK 27.1 Clang.
# The codegen-generated specs for rnscreens and safeareacontext use Folly's dynamic::dynamic(T)
# which triggers "implicit instantiation of undefined template NumericTypeHelper<Formatter<>>"
# because NDK 27.1 Clang is stricter about template substitution failure than Linux/Mac Clang.
# Setting CMAKE_CXX_FLAGS here propagates to all add_subdirectory targets that follow,
# including react_codegen_rnscreens and react_codegen_safeareacontext built by ReactNative-application.cmake.
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-error -Wno-implicit-int-float-conversion")

# Derive React Native path from this file's location (jni/ → main/ → src/ → app/ → android/ → project root)
set(REACT_NATIVE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../node_modules/react-native")
include(${REACT_NATIVE_PATH}/ReactAndroid/cmake-utils/ReactNative-application.cmake)
