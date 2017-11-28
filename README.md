# AltspaceUtil
Provides helper functions and behavior types for common functionality compatible with [AltspaceSDK](https://github.com/AltspaceVR/AltspaceSDK/) behavior design pattern.

## Usage
Include the utility library in your project:
```html
<script src="https://cdn.rawgit.com/NGenesis/altspacevr-behaviors/v0.8.5/js/altspaceutil.min.js"></script>
```

## Behaviors
* altspaceutil.behaviors.NativeComponent ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/NativeComponent.html))
  * Provides support for AltspaceVR native components to be attached to objects, providing sane configuration defaults where appropriate.
* altspaceutil.behaviors.NativeComponentSync ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/NativeComponentSync.html))
  * Provides support for AltspaceVR native component data to be synchronized over Firebase when used with SceneSync, Object3DSync and NativeComponent behaviors.
* altspaceutil.behaviors.TransformControls ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/TransformControls.html))
  * Enables an object's position, rotation and scale to be manipulated in AltspaceVR using a draggable transform gizmo.
* altspaceutil.behaviors.OrbitControls ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/OrbitControls.html))
  * Provides a convenience wrapper for THREE.OrbitControls when working with [altspace.utilities.Simulation](https://altspacevr.github.io/AltspaceSDK/doc/js/module-altspace_utilities.Simulation.html).
* altspaceutil.behaviors.UserEvents ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/UserEvents.html))
  * Subscribes to avatar and user preference update events for a given list of users.
* altspaceutil.behaviors.PreloadNativeSounds ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/PreloadNativeSounds.html))
  * Preloads sound files used by n-sound to ensure the resources are cached for subsequent uses.
* altspaceutil.behaviors.NativeTextMaterial ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/NativeTextMaterial.html))
  * Updates the color and opacity of a n-text native component using a material source.
* altspaceutil.behaviors.HoverMaterialOpacity
  * Changes the opacity of an object's material when the cursor hovers over it, and restores the original opacity when the cursor is no longer hovering over the object.
* altspaceutil.behaviors.HoverMaterialColor
  * Changes the color of an object's material when the cursor hovers over it, and restores the original color when the cursor is no longer hovering over the object.

## A-Frame Components
* altspace-transform-controls ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/aframe/altspace-transform-controls.html))
  * Enables an object's position, rotation and scale to be manipulated in AltspaceVR using a draggable transform gizmo.
* n-text-material ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/aframe/n-text-material.html))
  * Updates the color and opacity of a [n-text](https://altspacevr.github.io/AltspaceSDK/doc/aframe/module-altspace_components.n-text.html) native component using a material source.

**Please be aware that these behaviors may become deprecated over time as AltspaceSDK changes and new functionality is introduced.**
