@echo off
cd ../lib/three-bmfont-text/
call uglifyjs three-bmfont-text.js -m -o three-bmfont-text.min.js -c

cd ../../build/

cd ../js/
call uglifyjs common.js browsershims.js NativeComponent.js -m -o NativeComponent.min.js -c
call uglifyjs common.js browsershims.js Billboard.js -m -o Billboard.min.js -c
call uglifyjs common.js browsershims.js Text.js -m -o Text.min.js -c
call uglifyjs common.js browsershims.js GLTF.js -m -o GLTF.min.js -c
call uglifyjs common.js browsershims.js Sound.js -m -o Sound.min.js -c
call uglifyjs common.js browsershims.js OrbitControls.js -m -o OrbitControls.min.js -c
call uglifyjs common.js browsershims.js UserEvents.js -m -o UserEvents.min.js -c
call uglifyjs common.js browsershims.js PreloadNativeSounds.js -m -o PreloadNativeSounds.min.js -c
call uglifyjs common.js browsershims.js TransformControls.js -m -o TransformControls.min.js -c
call uglifyjs common.js browsershims.js HoverMaterialColor.js -m -o HoverMaterialColor.min.js -c
call uglifyjs common.js browsershims.js HoverMaterialOpacity.js -m -o HoverMaterialOpacity.min.js -c
call uglifyjs common.js browsershims.js NativeTextMaterial.js -m -o NativeTextMaterial.min.js -c
call uglifyjs common.js browsershims.js TWEEN.js -m -o TWEEN.min.js -c

copy /b common.js + browsershims.js + TWEEN.js + NativeComponent.js + Billboard.js + Text.js + GLTF.js + Sound.js + OrbitControls.js + UserEvents.js + PreloadNativeSounds.js + TransformControls.js + HoverMaterialColor.js + HoverMaterialOpacity.js + NativeTextMaterial.js altspaceutil.js
call uglifyjs altspaceutil.js -m -o altspaceutil.min.js -c --source-map altspaceutil.min.js.map

cd ../build/