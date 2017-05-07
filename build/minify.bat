@echo off
call uglifyjs ../js/NativeComponent.js ../js/OrbitControls.js ../js/UserEvents.js -m -o ../js/altspaceutil.min.js -c
call uglifyjs ../js/NativeComponent.js -m -o ../js/NativeComponent.min.js -c
call uglifyjs ../js/OrbitControls.js -m -o ../js/OrbitControls.min.js -c
call uglifyjs ../js/UserEvents.js -m -o ../js/UserEvents.min.js -c