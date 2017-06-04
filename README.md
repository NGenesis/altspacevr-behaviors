# AltspaceVR Behaviors
Behavior types for common functionality compatible with [AltspaceSDK](https://github.com/AltspaceVR/AltspaceSDK/) behavior design pattern.

## Usage
Include the utility library in your project:
```html
<script src="https://cdn.rawgit.com/NGenesis/altspacevr-behaviors/v0.6.9/js/altspaceutil.min.js"></script>
```

## Supported Behaviors
* altspaceutil.behaviors.NativeComponent ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/NativeComponent.html))
  * Provides support for AltspaceVR native components to be attached to objects, providing sane configuration defaults where appropriate.
* altspaceutil.behaviors.NativeComponentSync ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/NativeComponentSync.html))
  * Provides support for AltspaceVR native component data to be synchronized over Firebase when used with SceneSync, Object3DSync and NativeComponent behaviors.
* altspaceutil.behaviors.OrbitControls ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/OrbitControls.html))
  * Provides a convenience wrapper for THREE.OrbitControls when working with [altspace.utilities.Simulation](https://altspacevr.github.io/AltspaceSDK/doc/js/module-altspace_utilities.Simulation.html).
* altspaceutil.behaviors.UserEvents ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/UserEvents.html))
  * Subscribes to avatar and user preference update events for a given list of users.
* altspaceutil.behaviors.PreloadNativeSounds ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/PreloadNativeSounds.html))
  * Preloads sound files used by n-sound to ensure the resources are cached for subsequent uses.

**Please be aware that these behaviors may become deprecated over time as AltspaceSDK changes and new functionality is introduced.**
