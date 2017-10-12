@echo off
cd ../js/

call uglifyjs common.js NativeComponent.js -m -o NativeComponent.min.js -c
call uglifyjs common.js OrbitControls.js -m -o OrbitControls.min.js -c
call uglifyjs common.js UserEvents.js -m -o UserEvents.min.js -c
call uglifyjs common.js PreloadNativeSounds.js -m -o PreloadNativeSounds.min.js -c
call uglifyjs common.js TransformControls.js -m -o TransformControls.min.js -c

copy /b common.js + NativeComponent.js + OrbitControls.js + UserEvents.js + PreloadNativeSounds.js + TransformControls.js altspaceutil.js
call uglifyjs altspaceutil.js -m -o altspaceutil.min.js -c --source-map altspaceutil.min.js.map

cd ../build/