# AltspaceUtil
Provides helper functions, behaviors and A-Frame components for common functionality compatible with [AltspaceSDK](https://github.com/AltspaceVR/AltspaceSDK/).

# Usage
Include the utility library in your project:
```html
<script src="https://cdn.rawgit.com/NGenesis/altspacevr-behaviors/v0.8.5/js/altspaceutil.min.js"></script>
```

# Behaviors
## altspaceutil.behaviors.NativeComponent ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/NativeComponent.html))
Provides support for AltspaceVR native components to be attached to objects, providing sane configuration defaults where appropriate.

## altspaceutil.behaviors.NativeComponentSync ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/NativeComponentSync.html))
Provides support for AltspaceVR native component data to be synchronized over Firebase when used with SceneSync, Object3DSync and NativeComponent behaviors.

## altspaceutil.behaviors.TransformControls ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/TransformControls.html))
Enables an object's position, rotation and scale to be manipulated in AltspaceVR using a draggable transform gizmo.

### Parameters
`config` - Optional parameters.

| Name                    | Type           | Default | Description |
| ----------------------- | -------------- | ------- | ----------- |
| `controlType`           | String         | none    | The default control type to be selected.  Supported control types are 'none', 'position', 'rotate' or 'scale'. |
| `showButtons`           | Boolean        | false   | Specifies whether buttons should be displayed to toggle between control types. |
| `followTarget`          | Boolean        | true    | Specified whether the transform gizmo should follow the object that is being manipulated. |
| `target`                | THREE.Object3D | null    | The target that the transform gizmo should manipulate when interacted with.  If omitted, the object that the behavior is associated with will be used as the target. |
| `scale`                 | Number         | 1       | Adjusts the scale of the transform gizmo. |
| `allowNegativeScale`    | Boolean        | false   | Specifies whether the scale transform gizmo will allow the target's scale to be negative. |
| `positionAxisLock`      | Object         |         | Specifies which axes of the position gizmo can be displayed and manipulated. |
| `positionAxisLock.x`    | Boolean        | true    | X axis of the position gizmo. |
| `positionAxisLock.y`    | Boolean        | true    | Y axis of the position gizmo. |
| `positionAxisLock.z`    | Boolean        | true    | Z axis of the position gizmo. |
| `rotateAxisLock`        | Object         |         | Specifies which axes of the rotate gizmo can be displayed and manipulated. |
| `rotateAxisLock.x`      | Boolean        | true    | X axis of the rotate gizmo. |
| `rotateAxisLock.y`      | Boolean        | true    | Y axis of the rotate gizmo. |
| `rotateAxisLock.z`      | Boolean        | true    | Z axis of the rotate gizmo. |
| `scaleAxisLock`         | Object         |         | Specifies which axes of the scale gizmo can be displayed and manipulated. |
| `scaleAxisLock.x`       | Boolean        | true    | X axis of the scale gizmo. |
| `scaleAxisLock.y`       | Boolean        | true    | Y axis of the scale gizmo. |
| `scaleAxisLock.z`       | Boolean        | true    | Z axis of the scale gizmo. |
| `disableColliders`      | Boolean        | true    | Specifies whether colliders on the target object should be disabled. |
| `disableChildColliders` | Boolean        | true    | Specifies whether colliders on the target's children should be disabled. |

### Events

#### transform-controls-dragmove
Fires an event when the transform gizmo is being dragged.

| Name                    | Type              | Description |
| ----------------------- | ----------------- | ----------- |
| behavior                | TransformControls | The behavior that controls the transform gizmo. |
| parent                  | THREE.Object3D    | The object that the transform gizmo is parented to. |
| transformTarget         | THREE.Object3D    | The object that the transform gizmo will manipulate. |
| transformType           | String            | The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'. |
| transformAxis           | String            | The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes). |
| transformDelta          | THREE.Vector3     | The transform delta that was applied to the target object. |

#### transform-controls-dragbegin
Fires an event when the transform gizmo starts being dragged.

| Name                    | Type              | Description |
| ----------------------- | ----------------- | ----------- |
| behavior                | TransformControls | The behavior that controls the transform gizmo. |
| parent                  | THREE.Object3D    | The object that the transform gizmo is parented to. |
| transformTarget         | THREE.Object3D    | The object that the transform gizmo will manipulate. |
| transformType           | String            | The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'. |
| transformAxis           | String            | The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes). |

#### transform-controls-dragend
Fires an event when the transform gizmo is no longer being dragged.

| Name                    | Type              | Description |
| ----------------------- | ----------------- | ----------- |
| behavior                | TransformControls | The behavior that controls the transform gizmo. |
| parent                  | THREE.Object3D    | The object that the transform gizmo is parented to. |
| transformTarget         | THREE.Object3D    | The object that the transform gizmo will manipulate. |
| transformType           | String            | The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'. |
| transformAxis           | String            | The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes). |

## altspaceutil.behaviors.OrbitControls ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/OrbitControls.html))
Provides a convenience wrapper for THREE.OrbitControls when working with [altspace.utilities.Simulation](https://altspacevr.github.io/AltspaceSDK/doc/js/module-altspace_utilities.Simulation.html).

## altspaceutil.behaviors.UserEvents ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/UserEvents.html))
Subscribes to avatar and user preference update events for a given list of users.

## altspaceutil.behaviors.PreloadNativeSounds ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/PreloadNativeSounds.html))
Preloads sound files used by n-sound to ensure the resources are cached for subsequent uses.

## altspaceutil.behaviors.HoverMaterialOpacity
Changes the opacity of an object's material when the cursor hovers over it, and restores the original opacity when the cursor is no longer hovering over the object.

## altspaceutil.behaviors.HoverMaterialColor
Changes the color of an object's material when the cursor hovers over it, and restores the original color when the cursor is no longer hovering over the object.

## altspaceutil.behaviors.NativeTextMaterial ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/NativeTextMaterial.html))
Updates the color and opacity of a [n-text](https://altspacevr.github.io/AltspaceSDK/doc/aframe/module-altspace_components.n-text.html) native component using a material source.

### Parameters
`config` - Optional parameters.

| Name       | Type           | Default  | Description |
| ---------- | -------------- | -------- | ----------- |
| `material` | THREE.Material | null     | A reference to the material whose properties will be applied to the n-text native component.  Defaults to material of the object the behavior is attached to. |
| `color`    | Boolean        | true     | Specifies whether the n-text native component should use the color of the source material. |
| `opacity`  | Boolean        | true     | Specifies whether the n-text native component should use the opacity of the source material. |

# A-Frame Components
## altspace-transform-controls ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/aframe/altspace-transform-controls.html))
Enables an object's position, rotation and scale to be manipulated in AltspaceVR using a draggable transform gizmo.

### Properties

| Name                      | Type     | Default | Description |
| ------------------------- | -------- | ------- | ----------- |
| `control-type`            | String   | none    | The default control type to be selected.  Supported control types are 'none', 'position', 'rotate' or 'scale'. |
| `show-buttons`            | Boolean  | false   | Specifies whether buttons should be displayed to toggle between control types. |
| `follow-target`           | Boolean  | true    | Specified whether the transform gizmo should follow the object that is being manipulated. |
| `target`                  | Selector | null    | The target that the transform gizmo should manipulate when interacted with.  If omitted, the object that the behavior is associated with will be used as the target. |
| `scale`                   | Number   | 1       | Adjusts the scale of the transform gizmo. |
| `allow-negative-scale`    | Boolean  | false   | Specifies whether the scale transform gizmo will allow the target's scale to be negative. |
| `sync-events`             | Boolean  | true    | Specifies whether the sync ownership is gained when drag events are fired.  Requires `sync` and `sync-transform` components be present on the target object. |
| `position-axis-lock`      | String   | xyz     | Specifies which axes of the position gizmo can be displayed and manipulated. |
| `rotate-axis-lock`        | String   | xyz     | Specifies which axes of the rotate gizmo can be displayed and manipulated. |
| `scale-axis-lock`         | String   | xyz     | Specifies which axes of the scale gizmo can be displayed and manipulated. |
| `disable-colliders`       | Boolean  | true    | Specifies whether colliders on the target object should be disabled. |
| `disable-child-colliders` | Boolean  | true    | Specifies whether colliders on the target's children should be disabled. |

## n-text-material ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/aframe/n-text-material.html))
Updates the color and opacity of a [n-text](https://altspacevr.github.io/AltspaceSDK/doc/aframe/module-altspace_components.n-text.html) native component using a material source.

### Properties

| Name       | Type     | Default | Description |
| ---------- | -------- | ------- | ----------- |
| `material` | Selector |         | A reference to the object whose material properties will be applied to the n-text native component.  Defaults to material of the object the component is attached to. |
| `color`    | Boolean  | true    | Specifies whether the n-text native component should use the color of the source material. |
| `opacity`  | Boolean  | true    | Specifies whether the n-text native component should use the opacity of the source material. |
