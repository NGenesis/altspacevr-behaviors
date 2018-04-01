@echo off
cd ../js/

call uglifyjs common.js NativeComponent.js -m -o NativeComponent.min.js -c
call uglifyjs common.js OrbitControls.js -m -o OrbitControls.min.js -c
call uglifyjs common.js UserEvents.js -m -o UserEvents.min.js -c
call uglifyjs common.js PreloadNativeSounds.js -m -o PreloadNativeSounds.min.js -c
call uglifyjs common.js TransformControls.js -m -o TransformControls.min.js -c
call uglifyjs common.js HoverMaterialColor.js -m -o HoverMaterialColor.min.js -c
call uglifyjs common.js HoverMaterialOpacity.js -m -o HoverMaterialOpacity.min.js -c
call uglifyjs common.js NativeTextMaterial.js -m -o NativeTextMaterial.min.js -c
call uglifyjs common.js TWEEN.js -m -o TWEEN.min.js -c

copy /b common.js + TWEEN.js + NativeComponent.js + OrbitControls.js + UserEvents.js + PreloadNativeSounds.js + TransformControls.js + HoverMaterialColor.js + HoverMaterialOpacity.js + NativeTextMaterial.js altspaceutil.js
call uglifyjs altspaceutil.js -m -o altspaceutil.min.js -c --source-map altspaceutil.min.js.map

cd ../build/