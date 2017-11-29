# AltspaceUtil
Provides helper functions, behaviors and A-Frame components for common functionality compatible with [AltspaceSDK](https://github.com/AltspaceVR/AltspaceSDK/).

# Usage
Include the utility library in your project:
```html
<script src="https://cdn.rawgit.com/NGenesis/altspacevr-behaviors/v0.8.5/js/altspaceutil.min.js"></script>
```

# API Reference

## Behaviors
* [altspaceutil.behaviors.NativeComponent](#NativeComponent)
* [altspaceutil.behaviors.NativeComponentSync](#NativeComponentSync)
* [altspaceutil.behaviors.TransformControls](#TransformControls)
* [altspaceutil.behaviors.OrbitControls](#OrbitControls)
* [altspaceutil.behaviors.UserEvents](#UserEvents)
* [altspaceutil.behaviors.PreloadNativeSounds](#PreloadNativeSounds)
* [altspaceutil.behaviors.HoverMaterialOpacity](#HoverMaterialOpacity)
* [altspaceutil.behaviors.NativeTextMaterial](#NativeTextMaterial)

## Events
* [transform-controls-dragmove](#transform-controls-dragmove)
* [transform-controls-dragbegin](#transform-controls-dragbegin)
* [transform-controls-dragend](#transform-controls-dragend)

## A-Frame Components
* [altspace-transform-controls](#altspace-transform-controls)
* [n-text-material](#n-text-material)

# Behaviors

## <a name="NativeComponent">altspaceutil.behaviors.NativeComponent</a> ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/NativeComponent.html))
Provides support for AltspaceVR native components to be attached to objects, providing sane configuration defaults where appropriate.

## <a name="NativeComponentSync">altspaceutil.behaviors.NativeComponentSync</a> ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/NativeComponentSync.html))
Provides support for AltspaceVR native component data to be synchronized over Firebase.  The behavior must be used in conjunction with SceneSync, Object3DSync and a NativeComponent of the same type specified for NativeComponentSync.

### Parameters
`type` - Type of native component to be synchronized.  To retrieve the behavior using the `getBehaviorByType` method, prepend `sync-` to the name of the native component type (e.g. `sync-n-text` for an `n-text` native component).

`config` - Optional parameters.

| Name      | Type         | Default | Description |
| --------- | ------------ | ------- | ----------- |
| `syncRef` | Object3DSync | null    | A reference to the object syncing component.  Defaults to using the syncing component of the object the behavior is attached to. |

## <a name="TransformControls">altspaceutil.behaviors.TransformControls</a> ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/TransformControls.html))
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

#### <a name="transform-controls-dragmove">transform-controls-dragmove</a>
Fires an event when the transform gizmo is being dragged.

| Name                    | Type              | Description |
| ----------------------- | ----------------- | ----------- |
| behavior                | TransformControls | The behavior that controls the transform gizmo. |
| parent                  | THREE.Object3D    | The object that the transform gizmo is parented to. |
| transformTarget         | THREE.Object3D    | The object that the transform gizmo will manipulate. |
| transformType           | String            | The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'. |
| transformAxis           | String            | The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes). |
| transformDelta          | THREE.Vector3     | The transform delta that was applied to the target object. |

#### <a name="transform-controls-dragbegin">transform-controls-dragbegin</a>
Fires an event when the transform gizmo starts being dragged.

| Name                    | Type              | Description |
| ----------------------- | ----------------- | ----------- |
| behavior                | TransformControls | The behavior that controls the transform gizmo. |
| parent                  | THREE.Object3D    | The object that the transform gizmo is parented to. |
| transformTarget         | THREE.Object3D    | The object that the transform gizmo will manipulate. |
| transformType           | String            | The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'. |
| transformAxis           | String            | The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes). |

#### <a name="transform-controls-dragend">transform-controls-dragend</a>
Fires an event when the transform gizmo is no longer being dragged.

| Name                    | Type              | Description |
| ----------------------- | ----------------- | ----------- |
| behavior                | TransformControls | The behavior that controls the transform gizmo. |
| parent                  | THREE.Object3D    | The object that the transform gizmo is parented to. |
| transformTarget         | THREE.Object3D    | The object that the transform gizmo will manipulate. |
| transformType           | String            | The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'. |
| transformAxis           | String            | The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes). |

## <a name="OrbitControls">altspaceutil.behaviors.OrbitControls</a> ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/OrbitControls.html))
Provides a convenience wrapper for THREE.OrbitControls when working with [altspace.utilities.Simulation](https://altspacevr.github.io/AltspaceSDK/doc/js/module-altspace_utilities.Simulation.html).

## <a name="UserEvents">altspaceutil.behaviors.UserEvents</a> ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/UserEvents.html))
Subscribes to avatar and user preference update events for a given list of users, and dispatches events which have been triggered by a given user changing their avatar and/or account preferences.

### Parameters
`config` - Optional parameters.

| Name            | Type            | Default | Description |
| --------------- | --------------- | ------- | ----------- |
| `userIds`       | String[]        | null    | An array of User IDs for each user to dispatch events for.  When omitted, only events for the user currently logged in will be handled. |
| `onRequestData` | onRequestData   | null    | A precondition callback returning a boolean that determines if a user should have their data requested.  User data is requested if the callback returns true, otherwise no action is taken. |
| `refreshTime`   | Number          | 5000    | Duration to wait between user updates, in milliseconds. |
| `trace`         | Boolean         | false   | Specifies whether debugging information should be displayed. |

## <a name="PreloadNativeSounds">altspaceutil.behaviors.PreloadNativeSounds</a> ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/PreloadNativeSounds.html))
Preloads sound files used by n-sound to ensure the resources are cached for subsequent uses.

### Parameters

| Name     | Type     | Default | Description |
| -------- | -------- | ------- | ----------- |
| `sounds` | String[] |         | Native sound resources to be preloaded. |

## <a name="HoverMaterialOpacity">altspaceutil.behaviors.HoverMaterialOpacity</a>
Changes the opacity of an object's material when the cursor hovers over it, and restores the original opacity when the cursor is no longer hovering over the object.

### Parameters
`config` - Optional parameters.

| Name              | Type           | Default  | Description |
| ----------------- | -------------- | -------- | ----------- |
| `material`        | THREE.Material | null     | A reference to the material whose opacity will be updated.  Defaults to material of the object the behavior is attached to. |
| `opacity`         | Number         | 1        | The value that will be applied to the object's material opacity when the cursor hovers over it. |
| `beginDuration`   | Number         | 75       | Duration the hovered opacity adjustment effect is intended to take to complete, in milliseconds. |
| `endDuration`     | Number         | 75       | Duration the unhovered opacity adjustment effect is intended to take to complete, in milliseconds. |
| `revertOnDispose` | Boolean        | true     | Specifies whether the object's original material opacity should be restored when the behavior has been destroyed. |
| `eventListener`   | THREE.Object3D | null     | Specifies an optional object that will listen for cursor events.  By default the object that the behavior is attached to will be used as the event listener. |
| `hoverChildren`   | Boolean        | true     | Specifies whether hovering over children of the event listener object should invoke the hover effect. |

## <a name="HoverMaterialColor">altspaceutil.behaviors.HoverMaterialColor</a>
Changes the color of an object's material when the cursor hovers over it, and restores the original color when the cursor is no longer hovering over the object.

### Parameters
`config` - Optional parameters.

| Name              | Type           | Default                   | Description |
| ----------------- | -------------- | ------------------------- | ----------- |
| `material`        | THREE.Material | null                      | A reference to the material whose color will be updated.  Defaults to material of the object the behavior is attached to. |
| `color  `         | THREE.Color    | new THREE.Color('yellow') | The value that will be applied to the object's material color when the cursor hovers over it. |
| `beginDuration`   | Number         | 75                        | Duration the hovered color adjustment effect is intended to take to complete, in milliseconds. |
| `endDuration`     | Number         | 75                        | Duration the unhovered color adjustment effect is intended to take to complete, in milliseconds. |
| `revertOnDispose` | Boolean        | true                      | Specifies whether the object's original material color should be restored when the behavior has been destroyed. |
| `eventListener`   | THREE.Object3D | null                      | Specifies an optional object that will listen for cursor events.  By default the object that the behavior is attached to will be used as the event listener. |
| `hoverChildren`   | Boolean        | true                      | Specifies whether hovering over children of the event listener object should invoke the hover effect. |

## <a name="NativeTextMaterial">altspaceutil.behaviors.NativeTextMaterial</a> ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/NativeTextMaterial.html))
Updates the color and opacity of a [n-text](https://altspacevr.github.io/AltspaceSDK/doc/aframe/module-altspace_components.n-text.html) native component using a material source.

### Parameters
`config` - Optional parameters.

| Name       | Type           | Default  | Description |
| ---------- | -------------- | -------- | ----------- |
| `material` | THREE.Material | null     | A reference to the material whose properties will be applied to the n-text native component.  Defaults to material of the object the behavior is attached to. |
| `color`    | Boolean        | true     | Specifies whether the n-text native component should use the color of the source material. |
| `opacity`  | Boolean        | true     | Specifies whether the n-text native component should use the opacity of the source material. |

# A-Frame Components
## <a name="altspace-transform-controls">altspace-transform-controls</a> ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/aframe/altspace-transform-controls.html))
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

## <a name="n-text-material">n-text-material</a> ([Example](https://github.com/NGenesis/altspacevr-behaviors/blob/master/examples/aframe/n-text-material.html))
Updates the color and opacity of a [n-text](https://altspacevr.github.io/AltspaceSDK/doc/aframe/module-altspace_components.n-text.html) native component using a material source.

### Properties

| Name       | Type     | Default | Description |
| ---------- | -------- | ------- | ----------- |
| `material` | Selector |         | A reference to the object whose material properties will be applied to the n-text native component.  Defaults to material of the object the component is attached to. |
| `color`    | Boolean  | true    | Specifies whether the n-text native component should use the color of the source material. |
| `opacity`  | Boolean  | true    | Specifies whether the n-text native component should use the opacity of the source material. |

# Resources
* [Three.js API for AltspaceVR](https://altspacevr.github.io/AltspaceSDK/doc/js/)
* [A-Frame API for AltspaceVR](https://altspacevr.github.io/AltspaceSDK/doc/aframe/)
* [AltspaceVR Native Resources](https://altspacevr.github.io/AltspaceSDK/doc/aframe/module-altspace_resources.html)
* [TextMesh Pro Documentation](http://digitalnativestudios.com/textmeshpro/docs/rich-text/)
