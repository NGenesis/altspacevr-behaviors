@echo off
call uglifyjs ../js/common.js ../js/NativeComponent.js ../js/OrbitControls.js ../js/UserEvents.js -m -o ../js/altspaceutil.min.js -c --source-map ../js/altspaceutil.min.js.map
call uglifyjs ../js/common.js ../js/NativeComponent.js -m -o ../js/NativeComponent.min.js -c
call uglifyjs ../js/common.js ../js/OrbitControls.js -m -o ../js/OrbitControls.min.js -c
call uglifyjs ../js/common.js ../js/UserEvents.js -m -o ../js/UserEvents.min.js -c