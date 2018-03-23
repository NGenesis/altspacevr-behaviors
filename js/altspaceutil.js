'use strict';

window.altspaceutil = window.altspaceutil || {};
altspaceutil.behaviors = altspaceutil.behaviors || {};

// Native Event Helpers
altspaceutil.addNativeEventListener = function(name, callback) {
	return (altspace.inClient && altspace._internal && altspace._internal.couiEngine) ? altspace._internal.couiEngine.on(name, callback) : null;
}

altspaceutil.removeNativeEventListener = function(name, callback) {
	if(altspace.inClient && altspace._internal && altspace._internal.couiEngine) altspace._internal.couiEngine.off(name, callback);
}

altspaceutil.removeAllNativeEventListeners = function(name) {
	if(altspace.inClient && altspace._internal && altspace._internal.couiEngine && altspace._internal.couiEngine.events[name]) delete altspace._internal.couiEngine.events[name];
}

altspaceutil.getObject3DById = function(meshId) {
	return (altspace.inClient && altspace._internal) ? altspace._internal.getObject3DById(meshId) : null;
}

altspaceutil.getThreeJSScene = function() {
	return (altspace.inClient && altspace._internal) ? altspace._internal.getThreeJSScene() : null;
}

/**
* Create an absolute URL from the specified relative URL, using the current host as the URL base.
* @function getAbsoluteURL
* @param {String} [url] A relative URL.  Providing an absolute URL will return itself unchanged.
* @returns {String} An absolute URL of the given relative URL.
* @memberof module:altspaceutil
*/
altspaceutil.getAbsoluteURL = function(url) {
	if(url && !url.startsWith('http')) {
		if(url.startsWith('/')) {
			url = location.origin + url;
		} else {
			var currPath = location.pathname;
			if(!currPath.endsWith('/')) currPath = location.pathname.split('/').slice(0, -1).join('/') + '/';
			url = location.origin + currPath + url;
		}
	}

	return url;
}

// Produce a base path from the specified file URL.

/**
* Create a base path from the specified file URL.
* @function getBasePath
* @param {String} [url] A URL to a file.
* @returns {String} A URL to the file's base path.
* @memberof module:altspaceutil
*/
altspaceutil.getBasePath = function(url) {
	return url.split('/').slice(0, -1).join('/') + '/';
}

/**
* Flags a behavior as managed.  While managed, the behavior
* will automatically call dispose and reinitialize itself when the object
* is removed from the scene tree, and will remain in the object's behavior
* list until removeBehavior is called to destroy it.  Adding the object back
* into the scene will initialize the behavior as if it was a newly added behavior.
* @function manageBehavior
* @param {altspace.utilities.behaviors.Behavior} [behavior] The behavior to be managed.
* @param {THREE.Object3D} [object3d] The object that owns the behavior.
* @memberof module:altspaceutil
*/
altspaceutil.manageBehavior = function(behavior, object3d) {
	behavior.__isManaged = true;

	if(!object3d.__resetManagedBehavior) {
		object3d.addEventListener('removed', object3d.__resetManagedBehavior = function() {
			if(object3d.__resetManagedBehavior) {
				object3d.removeEventListener('removed', object3d.__resetManagedBehavior);
				object3d.__resetManagedBehavior = null;
			}

			object3d.traverse(function(child) {
				if(!child.__behaviorList) return;

				for(var behavior of child.__behaviorList) {
					if(behavior.__isInitialized && behavior.__isManaged) {
						try {
							if(behavior.dispose) behavior.dispose.call(behavior, child);
							behavior.__isInitialized = false;
						} catch(error) {
							console.group();
							(console.error || console.log).call(console, error.stack || error);
							console.log('[Behavior]');
							console.log(behavior);
							console.log('[Object3D]');
							console.log(child);
							console.groupEnd();
						}
					}
				}
			});
		});
	}
}

/**
* Flags a managed behavior as unmanaged.  After being unmanaged, the behavior
* must be manually removed from the object with removeBehavior to destroy it
* when it is no longer needed.
* @function unmanageBehavior
* @param {altspace.utilities.behaviors.Behavior} [behavior] The behavior to be unmanaged.
* @param {THREE.Object3D} [object3d] The object that owns the behavior.
* @memberof module:altspaceutil
*/
altspaceutil.unmanageBehavior = function(behavior, object3d) {
	behavior.__isManaged = false;
}

/**
* Clones an object and its children, including behaviors when possible.
* Note that a behavior will only be cloned if it implements a clone() function.
* @function cloneWithBehaviors
* @param {Boolean} [recursive=true] Whether children of the object should be cloned.
* @returns {THREE.Object3D}
* @memberof module:altspaceutil
*/
altspaceutil.cloneWithBehaviors = function(obj, recursive) {
	// Clone Object
	var other = obj.clone(false);

	// Clone Behaviors
	if(obj.__behaviorList && obj.__behaviorList.length > 0) {
		for(var behavior of obj.__behaviorList) {
			try {
				if(behavior.clone) {
					var otherBehavior = behavior.clone.call(behavior, other, obj);
					if(otherBehavior) {
						other.__behaviorList = other.__behaviorList || [];
						other.__behaviorList.push(otherBehavior);
					}
				}
			} catch(error) {
				console.group();
				(console.error || console.log).call(console, error.stack || error);
				console.log('[Behavior]');
				console.log(behavior);
				console.log('[Object3D]');
				console.log(obj);
				console.groupEnd();
			}
		}
	}

	// Clone Children
	if(recursive === undefined || recursive) {
		for(var child of obj.children) {
			other.add(child.cloneWithBehaviors(true));
		}
	}

	return other;
}
altspaceutil.behaviors.NativeComponentPlaceholderMesh = altspaceutil.behaviors.NativeComponentPlaceholderMesh || new THREE.Mesh(new THREE.BoxBufferGeometry(0.001, 0.001, 0.001), Object.assign(new THREE.MeshBasicMaterial(), { visible: false }));

altspaceutil.behaviors.NativeComponentDefaults = {
	'n-object': {
		data: {
			res: 'architecture/wall-4w-4h'
		}
	},

	'n-spawner': {
		data: {
			res: 'interactables/basketball'
		}
	},

	'n-text': {
		data: {
			text: '',
			fontSize: 10,
			width: 10,
			height: 1,
			horizontalAlign: 'middle',
			verticalAlign: 'middle'
		}
	},

	'n-sphere-collider': {
		data: {
			isTrigger: false,
			center: { 'x': 0, 'y': 0, 'z': 0 },
			radius: 0,
			type: 'environment'
		},
		config: {
			meshComponent: true
		},
		initComponent: initCollisionEventHandler
	},

	'n-box-collider': {
		data: {
			isTrigger: false,
			center: { 'x': 0, 'y': 0, 'z': 0 },
			size: { 'x': 0, 'y': 0, 'z': 0 },
			type: 'environment'
		},
		config: {
			meshComponent: true
		},
		initComponent: initCollisionEventHandler
	},

	'n-capsule-collider': {
		data: {
			isTrigger: false,
			center: { 'x': 0, 'y': 0, 'z': 0 },
			radius: 0,
			height: 0,
			direction: 'y',
			type: 'environment'
		},
		config: {
			meshComponent: true
		},
		initComponent: initCollisionEventHandler
	},

	'n-mesh-collider': {
		data: {
			isTrigger: false,
			convex: true,
			type: 'environment'
		},
		config: {
			recursiveMesh: true,
			inheritParentData: true,
			meshComponent: true
		},
		initComponent: initCollisionEventHandler
	},

	'n-container': {
		data: {
			capacity: 4
		},
		config: {
			meshComponent: true
		},
		attributes: {
			/**
			* The number of objects in the n-container.
			* @instance
			* @member {Number} count
			* @readonly
			* @memberof module:altspace/utilities/behaviors.NativeComponent.attributes
			*/
			count: 0
		},
		initComponent: function() {
			if(altspace.inClient) {
				// Handle Container Count Changes
				this.nativeEvents['NativeContainerCountChanged'] = altspaceutil.addNativeEventListener('NativeContainerCountChanged', (function(meshId, count, oldCount) {
					var object3d = altspaceutil.getObject3DById(meshId);
					if(object3d && object3d === this.component) {
						this.attributes.count = count;

						/**
						* Fires an event every time an object enters or leaves the bounds of the n-container.
						*
						* @event container-count-changed
						* @property {Number} count The new object count
						* @property {Number} oldCount The old object count
						* @property {THREE.Object3D} target - The object which emitted the event.
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						object3d.dispatchEvent({
							type: 'container-count-changed',
							detail: {
								count: count,
								oldCount: oldCount
							},
							bubbles: true,
							target: object3d
						});
					}
				}).bind(this));

				// Handle Container State Changes
				this.nativeEvents['NativeContainerStateChanged'] = altspaceutil.addNativeEventListener('NativeContainerStateChanged', (function(meshId, stateName, didGain) {
					var object3d = altspaceutil.getObject3DById(meshId);
					if(object3d && object3d === this.component) {
						var oldState = this.state;

						this.state = didGain ? stateName : undefined;
						object3d.dispatchEvent({
							type: didGain ? 'stateadded' : 'stateremoved',
							detail: { state: stateName },
							bubbles: true,
							target: object3d
						});

						/**
						* Fires an event when the n-container reaches zero objects contained.
						*
						* @event container-empty
						* @property {THREE.Object3D} target - The object which emitted the event.
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						/**
						* Fires an event when the n-container reaches its capacity
						*
						* @event container-full
						* @property {THREE.Object3D} target - The object which emitted the event.
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						if(this.state !== oldState && this.state) {
							object3d.dispatchEvent({
								type: stateName,
								bubbles: true,
								target: object3d
							});
						}
					}
				}).bind(this));
			}

			// Forward Events From Placeholder To Behavior Owner
			if(this.placeholder) {
				var forwardPlaceholderEvent = (function(event) {
					this.object3d.dispatchEvent(event);
				}).bind(this);
				this.placeholder.addEventListener('container-count-changed', forwardPlaceholderEvent);
				this.placeholder.addEventListener('container-empty', forwardPlaceholderEvent);
				this.placeholder.addEventListener('container-full', forwardPlaceholderEvent);
				this.placeholder.addEventListener('triggerenter', forwardPlaceholderEvent);
				this.placeholder.addEventListener('triggerexit', forwardPlaceholderEvent);
			}
		}
	},

	'n-sound': {
		data: {
			on: '',
			res: '',
			src: '',
			loop: false,
			volume: 1,
			autoplay: false,
			oneshot: false,
			spatialBlend: 1,
			pitch: 1,
			minDistance: 1,
			maxDistance: 12
		},
		attributes: {
			/**
			* Indicates that the component has been loaded by the AltspaceVR client.
			* @instance
			* @member {Boolean} loaded
			* @readonly
			* @memberof module:altspace/utilities/behaviors.NativeComponent.attributes
			*/
			loaded: false
		},
		initComponent: function() {
			this.data.src = altspaceutil.getAbsoluteURL(this.data.src);

			if(altspace.inClient) {
				// Override A-Frame Callback For NativeSoundLoadedEvent To Suppress Errors That Occur When Object Doesn't Exist
				if(!altspaceutil.overrideNativeSoundLoadedEvent) {
					altspaceutil.overrideNativeSoundLoadedEvent = true;

					altspaceutil.removeAllNativeEventListeners('NativeSoundLoadedEvent');
					altspaceutil.addNativeEventListener('NativeSoundLoadedEvent', function(meshId) {
						altspace._internal.forwardEventToChildIFrames('NativeSoundLoadedEvent', arguments);

						var object3D = altspace._internal.getObject3DById(meshId);
						if(object3D && object3D.el) targetEl.emit('n-sound-loaded', null, true);
					});
				}

				// Handle Sound Loaded
				this.nativeEvents['NativeSoundLoadedEvent'] = altspaceutil.addNativeEventListener('NativeSoundLoadedEvent', (function(meshId) {
					var object3d = altspaceutil.getObject3DById(meshId);
					if(object3d && object3d === this.component) {
						this.attributes.loaded = true;
						/**
						* Fires an event once the n-sound has finished loading.
						*
						* @event n-sound-loaded
						* @property {THREE.Object3D} target - The object which emitted the event.
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						object3d.dispatchEvent({
							type: 'n-sound-loaded',
							bubbles: true,
							target: object3d
						});
					}
				}).bind(this));
			}

			// Forward Events From Placeholder To Behavior Owner
			if(this.placeholder) {
				var forwardPlaceholderEvent = (function(event) {
					this.object3d.dispatchEvent(event);
				}).bind(this);
				this.placeholder.addEventListener('n-sound-loaded', forwardPlaceholderEvent);
				this.placeholder.addEventListener('sound-paused', forwardPlaceholderEvent);
				this.placeholder.addEventListener('sound-played', forwardPlaceholderEvent);
			}
		},
		callComponentAction: function(functionName, functionArgs) {
			if(functionName === 'play') {
				this.component.dispatchEvent({
					type: 'sound-played',
					bubbles: true,
					target: this.component
				});
			} else if(functionName === 'pause') {
				this.component.dispatchEvent({
					type: 'sound-paused',
					bubbles: true,
					target: this.component
				});
			}

			altspace.callNativeComponentAction(this.component, this.type, functionName, functionArgs);
		},
		update: function() {
			this.data.src = altspaceutil.getAbsoluteURL(this.data.src);
			this.attributes.loaded = false;

			if(this.initialized) altspace.updateNativeComponent(this.component, this.type, this.data);

			if(this.playHandlerType) {
				this.component.removeEventListener(this.playHandlerType, this.playHandler);
				this.playHandlerType = null;
			}

			if(this.data.on && this.data.on !== '') {
				if(this.playHandler === undefined) this.playHandler = this.callComponentAction.bind(this, 'play');
				this.playHandlerType = this.data.on;
				this.component.addEventListener(this.playHandlerType, this.playHandler);
			}
		}
	},

	'n-skeleton-parent': {
		data: {
			part: 'head',
			side: 'center',
			index: 0,
			userId: null // defaults to current user when omitted
		},
		config: {
			recursiveMesh: true,
			inheritParentData: true,
			meshComponent: true
		}
	},

	'n-cockpit-parent': {
		config: {
			sendUpdates: false,
			recursiveMesh: true,
			inheritParentData: true,
			meshComponent: true
		}
	},

	'n-billboard': {
		config: {
			sendUpdates: false,
			meshComponent: true
		}
	},

	'n-layout-browser': {
		data: {
			url: 'about:blank',
			isEnclosure: false
		},
		initComponent: function() {
			this.data.url = altspaceutil.getAbsoluteURL(this.data.url);
			this.scene.userData.altspace = this.scene.userData.altspace || {};
			this.scene.userData.altspace.initialized = true;
		},
		update: function() {
			this.data.url = altspaceutil.getAbsoluteURL(this.data.url);
			if(this.initialized) altspace.updateNativeComponent(this.component, this.type, this.data);
		}
	},

	'n-portal': {
		data: {
			targetSpace: null, // defaults to current space when omited
			targetEvent: null, // defaults to current space when omited
			targetPosition: { x: 0, y: 0, z: 0 },
			targetQuaternion: { x: 0, y: 0, z: 0, w: 1 }
		},
		update: function() {
			if(this.config.targetEntity) {
				this.scene.updateMatrixWorld(true);
				this.data.targetPosition = this.config.targetEntity.getWorldPosition();
				var quaternion = this.config.targetEntity.getWorldQuaternion();
				this.data.targetQuaternion = { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
			}

			if(this.initialized) altspace.updateNativeComponent(this.component, this.type, this.data);
		}
	},

	'n-gltf': {
		data: {
			url: '',
			sceneIndex: 0
		},
		attributes: {
			/**
			* Indicates that the component has been loaded by the AltspaceVR client.
			* @instance
			* @member {Boolean} loaded
			* @readonly
			* @memberof module:altspace/utilities/behaviors.NativeComponent.attributes
			*/
			loaded: false
		},
		initComponent: function() {
			this.data.url = altspaceutil.getAbsoluteURL(this.data.url);

			if(altspace.inClient) {
				// Override A-Frame Callback For NativeGLTFLoadedEvent To Suppress Errors That Occur When Object Doesn't Exist
				if(!altspaceutil.overrideNativeGLTFLoadedEvent) {
					altspaceutil.overrideNativeGLTFLoadedEvent = true;

					altspaceutil.removeAllNativeEventListeners('NativeGLTFLoadedEvent');
					altspaceutil.addNativeEventListener('NativeGLTFLoadedEvent', function(meshId) {
						altspace._internal.forwardEventToChildIFrames('NativeGLTFLoadedEvent', arguments);

						var object3D = altspace._internal.getObject3DById(meshId);
						if(object3D && object3D.el) targetEl.emit('n-gltf-loaded', null, true);
					});
				}

				// Handle GLTF Loaded
				this.nativeEvents['NativeGLTFLoadedEvent'] = altspaceutil.addNativeEventListener('NativeGLTFLoadedEvent', (function(meshId) {
					var object3d = altspaceutil.getObject3DById(meshId);
					if(object3d && object3d === this.component) {
						this.attributes.loaded = true;
						/**
						* Fires an event once the n-gltf has finished loading.
						*
						* @event n-gltf-loaded
						* @property {THREE.Object3D} target - The object which emitted the event.
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						object3d.dispatchEvent({
							type: 'n-gltf-loaded',
							bubbles: true,
							target: object3d
						});
					}
				}).bind(this));
			}

			// Forward Events From Placeholder To Behavior Owner
			if(this.placeholder) {
				var forwardPlaceholderEvent = (function(event) {
					this.object3d.dispatchEvent(event);
				}).bind(this);
				this.placeholder.addEventListener('n-gltf-loaded', forwardPlaceholderEvent);
			}
		},
		update: function() {
			this.data.url = altspaceutil.getAbsoluteURL(this.data.url);
			this.attributes.loaded = false;
			if(this.initialized) altspace.updateNativeComponent(this.component, this.type, this.data);
		},
		callComponentFunc: function(functionName, functionArgs) {
			return altspace.callNativeComponentFunc(this.component, this.type, functionName, functionArgs).then(function(data) {
				if(functionName === 'GetBoundingBox') return new THREE.Box3(new THREE.Vector3().subVectors(data.center, data.extents), new THREE.Vector3().addVectors(data.center, data.extents));
				return data;
			});
		}
	},

	'n-rigidbody': {
		data: {
			mass: 1,
			drag: 0,
			angularDrag: 0.05,
			useGravity: true,
			isKinematic: false,
			positionConstraints: [false, false, false],
			rotationConstraints: [false, false, false],
		},
		config: {
			meshComponent: true
		},
		initComponent: function() {
			if(altspace.inClient) {
				// Handle Transform Update Events
				/*var tempInverseMatrix, pooledWorldPosition, pooledWorldQuaternion;
				this.nativeEvents['NativeTransformUpdateEvent'] = altspaceutil.addNativeEventListener('NativeTransformUpdateEvent', (function(meshId, positionX, positionY, positionZ, rotationX, rotationY, rotationZ, rotationW) {
					var object3d = altspaceutil.getObject3DById(meshId);
					if(object3d && object3d === this.component) {
						tempInverseMatrix = tempInverseMatrix || new THREE.Matrix4();
						tempInverseMatrix.getInverse(altspaceutil.getThreeJSScene().matrix);

						pooledWorldPosition = pooledWorldPosition || new THREE.Vector3();
						pooledWorldPosition.set(positionX, positionY, positionZ);
						pooledWorldPosition.applyMatrix4(tempInverseMatrix);

						pooledWorldQuaternion = pooledWorldQuaternion || new THREE.Quaternion();
						pooledWorldQuaternion.set(rotationX, rotationY, rotationZ, rotationW);
						//TODO: This function doesn't exist. Not taking scene rotation into account at the moment because of this.
						//Possibly compose the position and rotation into a single Matrix4 and apply the inverse scene matrix and then decompose the matrix.
						//pooledWorldQuaternion.applyMatrix4(tempInverseMatrix);

						object3d.dispatchEvent({
							type: 'native-transform-update',
							worldPosition: pooledWorldPosition,
							worldQuaternion: pooledWorldQuaternion,
							bubbles: true,
							target: object3d
						});
					}
				}).bind(this));*/

				// Forward Events From Placeholder To Behavior Owner
				if(this.placeholder) {
					var forwardPlaceholderEvent = (function(event) {
						this.object3d.dispatchEvent(event);
					}).bind(this);
					this.placeholder.addEventListener('native-transform-update', forwardPlaceholderEvent);
				}
			}
		}
	}
};

function initCollisionEventHandler() {
	if(altspace.inClient && this.placeholder) {
		this.nativeEvents['NativeCollisionEvent'] = altspaceutil.addNativeEventListener('NativeCollisionEvent', (function(type, thisMeshId, otherMeshId, relativeVelocityX, relativeVelocityY, relativeVelocityZ, normalX, normalY, normalZ, pointX, pointY, pointZ) {
			var thisObject3D = altspaceutil.getObject3DById(thisMeshId), otherObject3D = altspaceutil.getObject3DById(otherMeshId);
			if(thisObject3D === this.placeholder || otherObject3D === this.placeholder) {
				var event = {
					type: type,
					bubbles: true,
					target: (thisObject3D === this.placeholder) ? this.object3d : thisObject3D,
					other: (otherObject3D === this.placeholder) ? this.object3d : otherObject3D,
					relativeVelocity: {
						x: relativeVelocityX,
						y: relativeVelocityY,
						z: relativeVelocityZ
					}
				};

				//TODO BUG: the position needs to be transformed by the scene
				//Some collision events (such as exit) seem to sometimes have no contact points
				if (normalX) {
					event.point = {
						position: {
							x: pointX,
							y: pointY,
							z: pointZ
						},
						normal: {
							x: normalX,
							y: normalY,
							z: normalZ
						}
					}
				}

				this.object3d.dispatchEvent(event);
			}
		}).bind(this));

		this.nativeEvents['NativeTriggerEvent'] = altspaceutil.addNativeEventListener('NativeTriggerEvent', (function(type, thisMeshId, otherMeshId) {
			var thisObject3D = altspaceutil.getObject3DById(thisMeshId), otherObject3D = altspaceutil.getObject3DById(otherMeshId);
			if(thisObject3D === this.placeholder || otherObject3D === this.placeholder) {
				var event = {
					type: type,
					bubbles: true,
					target: (thisObject3D === this.placeholder) ? this.object3d : thisObject3D,
					other: (otherObject3D === this.placeholder) ? this.object3d : otherObject3D,
				};

				this.object3d.dispatchEvent(event);
			}
		}).bind(this));
	}
}

/**
 * Provides support for AltspaceVR native components to be attached to objects, providing sane configuration defaults where appropriate.
 * 
 * @class NativeComponent
 * @param {String} [type] Native component type.
 * @param {Object} [data] Native component properties.
 * @param {Object} [config] Optional parameters.  Many of these properties are provided only to override the internal behavior of a component in specialized use cases.
 * @param {THREE.Object3D} [config.targetEntity=null] An object in the scene that a user will teleport to when entering a native portal.
 * @param {Boolean} [config.useCollider=false] Specifies whether cursor collision should be disabled on the native component.
 * @param {Boolean} [config.sharedComponent=true] Specifies whether the native component should share the same THREE.Mesh instance with other native components.
 * @param {Boolean} [config.recursiveMesh=false] Specifies whether the native component is applied recursively to all THREE.Mesh children.
 * @param {Boolean} [config.recursive=false] Specifies whether the native component is applied recursively to all children.
 * @param {Boolean} [config.sendUpdates=true] Specifies whether the native component should send updates to the native Altspace client.
 * @param {Boolean} [config.updateOnStaleData=true] Specifies whether the native component should send updates to the native Altspace client when a property has changed.
 * @param {Boolean} [config.inheritParentData=false] Specifies whether the native component should inherit its property state from a parent component.
 * @param {Boolean} [config.meshComponent=false] Specifies whether the native component is treated as a mesh-specific component.  This is used as a performance optimization to defer initialization of mesh-specific components (e.g. native parents and colliders) attached to placeholder objects, until another component is added that gives them functionality (e.g. text, spawner).
 * @memberof module:altspace/utilities/behaviors
 */
altspaceutil.behaviors.NativeComponent = function(_type, _data, _config) {
	this.type = _type || 'NativeComponent';

	this.nativeEvents = {};
	this.defaults = altspaceutil.behaviors.NativeComponentDefaults[this.type];
	this.config = Object.assign({ sendUpdates: true, recursiveMesh: false, recursive: false, useCollider: false, updateOnStaleData: true, sharedComponent: true, inheritParentData: false, meshComponent: false }, (this.defaults && this.defaults.config) ? JSON.parse(JSON.stringify(this.defaults.config)) : {}, _config);
	this.data = Object.assign((this.defaults && this.defaults.data) ? JSON.parse(JSON.stringify(this.defaults.data)) : {}, _data);
	this.attributes = (this.defaults && this.defaults.attributes) ? JSON.parse(JSON.stringify(this.defaults.attributes)) : {};

	this.awake = function(o, s) {
		this.scene = s;
		this.component = this.object3d = o;
		this.initialized = false;

		altspaceutil.manageBehavior(this, this.object3d);

		if(!(this.component instanceof THREE.Mesh)) {
			// Cannot Have Multiple Components Of The Same Type Per Mesh, Create New Placeholder For Subsequent Components
			if(this.config.sharedComponent && this.object3d.userData._sharedNativeComponent) {
				for(var behavior of this.object3d.userData._sharedNativeComponent.behaviors) {
					if(behavior !== this && behavior.type === this.type) {
						this.config.sharedComponent = false;
						break;
					}
				}
			}

			// Create Placeholder Mesh
			if(this.config.sharedComponent) {
				this.sharedData = this.object3d.userData._sharedNativeComponent = this.object3d.userData._sharedNativeComponent || {};
				this.sharedData.placeholder = this.sharedData.placeholder || altspaceutil.behaviors.NativeComponentPlaceholderMesh.clone();
				this.sharedData.behaviors = this.sharedData.behaviors || [];
				this.sharedData.behaviors.push(this);
				if(!this.sharedData.placeholder.parent) this.object3d.add(this.sharedData.placeholder);
			}

			this.component = this.placeholder = (this.sharedData && this.sharedData.placeholder) ? this.sharedData.placeholder : altspaceutil.behaviors.NativeComponentPlaceholderMesh.clone();
			this.object3d.add(this.placeholder);
		}

		if(this.defaults && this.defaults.initComponent) this.defaults.initComponent.bind(this)();

		if(!this.config.useCollider) {
			this.component.userData.altspace = this.component.userData.altspace || {};
			this.component.userData.altspace.collider = this.component.userData.altspace.collider || {};
			this.component.userData.altspace.collider.enabled = false;
		}

		// Link Children To Nearest Parent When Component Data Is Inherited
		var linkedParent = false;
		if(this.config.inheritParentData && !this.parent) {
			var parent = this.object3d.parent;
			while(parent) {
				var behavior = parent.getBehaviorByType(this.type);
				if(behavior) {
					this.parent = behavior.parent || behavior;
					linkedParent = true;
					break;
				}

				parent = parent.parent;
			}
		}

		this.update();

		// Add Component To Descendants
		if((this.config.recursive || this.config.recursiveMesh) && (!this.parent || linkedParent)) {
			this.object3d.traverse((function(child) {
				if(child !== this.object3d && child !== this.placeholder && (this.config.recursive || (this.config.recursiveMesh && child instanceof THREE.Mesh))) {
					if(!child.getBehaviorByType(this.type)) child.addBehavior(Object.assign(new altspaceutil.behaviors.NativeComponent(this.type, this.data, this.config), { parent: this }));
				}
			}).bind(this));
		}
	}

	this.update = function() {
		if(this.placeholder) {
			// Placeholder Inherits Object Properties
			if(this.object3d.userData.altspace) this.placeholder.userData.altspace = this.object3d.userData.altspace;
			this.placeholder.visible = this.object3d.visible;
		}

		// Children Inherit Parent's Data
		if(this.parent && this.config.inheritParentData) this.data = Object.assign({}, this.parent.data);

		// Recursively Applied Components Are Automatically Added To Children
		if(!this.parent && (this.config.recursive || this.config.recursiveMesh)) {
			this.object3d.traverse((function(child) {
				if(child !== this.object3d && child !== this.placeholder && (this.config.recursive || (this.config.recursiveMesh && child instanceof THREE.Mesh))) {
					if(!child.getBehaviorByType(this.type)) child.addBehavior(Object.assign(new altspaceutil.behaviors.NativeComponent(this.type, this.data, this.config), { parent: this }));
				}
			}).bind(this));
		}

		if(altspace.inClient) {
			if(!this.initialized) {
				if(!this.config.meshComponent || this.object3d instanceof THREE.Mesh) {
					this.initialized = true;
				} else if(this.config.sharedComponent && this.sharedData) {
					// Initialize Shared Components That Previously Offered No Functional Benefit
					for(var behavior of this.sharedData.behaviors) {
						if(behavior.initialized) {
							this.initialized = true;
							break;
						}
					}
				}

				if(this.initialized) altspace.addNativeComponent(this.component, this.type);
			}

			if(this.config.sendUpdates) {
				if(this.config.updateOnStaleData) {
					var newData = JSON.stringify(this.data);
					if(this.oldData !== newData) {
						if(this.defaults && this.defaults.update) {
							this.defaults.update.bind(this)();
						} else if(this.initialized) {
							altspace.updateNativeComponent(this.component, this.type, this.data);
						}
						this.oldData = newData;
					}
				} else {
					if(this.defaults && this.defaults.update) {
						this.defaults.update.bind(this)();
					} else if(this.initialized) {
						altspace.updateNativeComponent(this.component, this.type, this.data);
					}
				}
			}
		}
	}

	/**
	* Invokes an action associated with the native component.  Deprecated. See callComponentAction.
	*
	* @method callComponent
	* @param {String} [functionName] - The function name to invoke on the native component.
	* @param {Arguments...} [functionArgs] - Arguments that will be passed to the function when invoked.
	* @memberof module:altspaceutil/behaviors.NativeComponent
	*/
	this.callComponent = function(functionName, functionArgs) {
		this.callComponentAction(functionName, functionArgs);
	}

	/**
	* Invokes an action associated with the native component.
	*
	* @method callComponentAction
	* @param {String} [functionName] - The function name to invoke on the native component.
	* @param {Arguments...} [functionArgs] - Arguments that will be passed to the function when invoked.
	* @memberof module:altspaceutil/behaviors.NativeComponent
	*/
	this.callComponentAction = function(functionName, functionArgs) {
		if(!this.initialized || !this.component) return;

		if(this.defaults && this.defaults.callComponentAction) this.defaults.callComponentAction.bind(this)(functionName, functionArgs);
		else altspace.callNativeComponentAction(this.component, this.type, functionName, functionArgs);
	}

	/**
	* Calls a function associated with the native component, and returns a promise of the value that will be returned by the native component function.
	*
	* @method callComponentFunc
	* @param {String} [functionName] - The function name to invoke on the native component.
	* @param {Arguments...} [functionArgs] - Arguments that will be passed to the function when invoked.
	* @memberof module:altspaceutil/behaviors.NativeComponent
	*/
	this.callComponentFunc = function(functionName, functionArgs) {
		if(!this.initialized || !this.component) return Promise.reject();

		if(this.defaults && this.defaults.callComponentFunc) return this.defaults.callComponentFunc.bind(this)(functionName, functionArgs);
		return altspace.callNativeComponentFunc(this.component, this.type, functionName, functionArgs);
	}

	this.dispose = function() {
		if(this.config.recursive || this.config.recursiveMesh && !this.parent) {
			this.object3d.traverse((function(child) {
				if(child !== this.object3d && child !== this.placeholder && (this.config.recursive || (this.config.recursiveMesh && child instanceof THREE.Mesh))) {
					var childComponent = child.getBehaviorByType(this.type);
					if(childComponent && childComponent.parent === this) child.removeBehavior(childComponent);
				}
			}).bind(this));
		}

		for(var nativeEvent in this.nativeEvents) {
			if(this.nativeEvents.hasOwnProperty(nativeEvent)) this.nativeEvents[nativeEvent].clear();
		}

		if(this.initialized) altspace.removeNativeComponent(this.component, this.type);

		if(this.config.sharedComponent && this.sharedData) {
			// Decrease Reference Count
			var index = this.sharedData.behaviors.indexOf(this);
			if(index >= 0) this.sharedData.behaviors.splice(index, 1);

			// Remove Shared Component Once All References Are Removed
			if(this.sharedData.behaviors.length <= 0) {
				if(this.sharedData.placeholder.parent) this.sharedData.placeholder.parent.remove(this.sharedData.placeholder);
				delete this.object3d.userData._sharedNativeComponent;
			}
		} else if(this.placeholder) {
			// Remove Standalone Placeholder
			this.object3d.remove(this.placeholder);
		}

		this.nativeEvents = {};
		this.initialized = false;
		this.object3d = null;
		this.placeholder = null;
		this.component = null;
		this.scene = null;
		this.sharedData = null;
		this.oldData = null;
		this.parent = null;
	}

	/**
	* Retrieves an attribute associated with a native component.
	*
	* @method getAttribute
	* @param {String} [attributeName] - An attribute name associated with the native component.
	* @returns {Object} The value of the given attribute.
	* @memberof module:altspaceutil/behaviors.NativeComponent
	*/
	this.getAttribute = function(attributeName) {
		return this.attributes[attributeName];
	}

	this.clone = function() {
		return new altspaceutil.behaviors.NativeComponent(this.type, this.data, this.config);
	}
}

/**
 * The NativeComponentSync behavior syncs an object's native component data.  
 * **Note:** NativeComponentSync must be used in conjunction with 
 * [SceneSync]{@link module:altspace/utilities/behaviors.SceneSync}, 
 * [Object3DSync]{@link module:altspace/utilities/behaviors.Object3DSync} and 
 * a [NativeComponent]{@link module:altspaceutil/behaviors.NativeComponent} of
 * the same type specified for NativeComponentSync.
 *
 * @class NativeComponentSync
 * @param {String} [type] Type of native component to be synchronized.  To retrieve the behavior using the getBehaviorByType method, prepend "sync-" to the name of the native component type (e.g. sync-n-text for an n-text native component).
 * @param {Object} [config] Optional parameters.
 * @param {Object3DSync} [config.syncRef=null] A reference to the object syncing component.  Defaults to using the syncing component of the object the behavior is attached to.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.NativeComponentSync = function(_type, _config) {
	this.componentType = _type || 'NativeComponent';
	this.type = _type ? ('sync-' + _type) : 'NativeComponentSync';
	this.config = _config || {};

	this.awake = function(o) {
		this.object3d = o;

		altspaceutil.manageBehavior(this, this.object3d);

		this.component = this.object3d.getBehaviorByType(this.componentType);
		this.sync = this.config.syncRef || this.object3d.getBehaviorByType('Object3DSync');
		this.dataRef = this.sync.dataRef.child(this.componentType).child('data');
		this.dataRefUpdate = this.dataRef.on('value', (function(snapshot) {
			if(this.sync.isMine) return;

			var data = snapshot.val();
			if(!data) return;

			if(!this.component) {
				this.component = this.object3d.getBehaviorByType(this.componentType);

				if(!this.component) {
					this.component = new altspaceutil.behaviors.NativeComponent(this.componentType, data);
					this.object3d.addBehavior(this.component);
					return;
				}
			}

			this.component.data = data;
		}).bind(this));

		this.intervalId = setInterval(this.update.bind(this), this.sync.autoSendRateMS);
	}

	this.update = function() {
		if(!this.sync.isMine || !this.component) return;

		var newData = JSON.stringify(this.component.data);
		if(this.oldData !== newData) {
			this.dataRef.set(this.component.data);
			this.oldData = newData;
		}
	}

	this.dispose = function() {
		if(this.intervalId) clearInterval(this.intervalId);

		if(this.dataRefUpdate && this.dataRef) this.dataRef.off('value', this.dataRefUpdate);
		this.object3d = null;
		this.component = null;
		this.sync = null;
		this.dataRef = null;
		this.dataRefUpdate = null;
		this.oldData = null;
	}

	this.clone = function() {
		return new altspaceutil.behaviors.NativeComponentSync(this.componentType, this.config);
	}
}
/**
 * The OrbitControls behavior provides a convenience wrapper for loading
 * and updating THREE.OrbitControls.
 *
 * @class OrbitControls
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.OrbitControls = function() {
	this.type = 'OrbitControls';

	this.awake = function(o) {
		if(!altspace.inClient) this.controls = new THREE.OrbitControls(o);
		altspaceutil.manageBehavior(this, o);
	}

	this.update = function(deltaTime) {
		if(!altspace.inClient) this.controls.update();
	}

	this.dispose = function() {
		this.controls = null;
	}
}
/**
 * An identifier that represents the user's avatar type preference.
 * @typedef {String} module:altspaceutil/behaviors.UserEvents~AvatarId
 **/

/**
 * The UserEvents behavior dispatches events which have been triggered by a given user
 * changing their avatar and/or account preferences.
 *
 * @class UserEvents
 * @param {Object} [config] Optional parameters.
 * @param {String[]} [config.userIds=null] An array of User IDs for each user to dispatch events for.
 * When omitted, only events for the user currently logged in will be handled.
 * @param {onRequestData} [config.onRequestData=null] A precondition callback returning a boolean that
 * determines if a user should have their data requested.  User data is requested if the callback
 * returns true, otherwise no action is taken.
 * @param {Number} [config.refreshTime=5000] Duration to wait between user updates, in milliseconds.
 * @param {Boolean} [config.trace=false] Specifies whether debugging information should be displayed.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.UserEvents = function(config) {
	this.config = config || {};
	this.type = 'UserEvents';

	/**
	* A precondition callback returning a boolean that determines if a user should have their data requested.
	* User data is requested if the callback returns true, otherwise no action is taken.
	* @callback onRequestData
	* @param {String} userId User ID of a user who will have their data requested.
	* @param {THREE.Object3D} object The object that will emit the request.
	* @memberof module:altspaceutil/behaviors.UserEvents
	*/
	this.onRequestData = this.config.onRequestData || null;

	this.refreshTime = this.config.refreshTime || 5000;
	this.trace = this.config.trace || false;
	this.userIds = this.config.userIds || [];

	this.awake = function(o) {
		this.object3d = o;
		this.time = 0;
		this.loading = false;
		this.users = {};
		this.userIds = this.userIds.constructor === Array ? this.userIds : [this.userIds];

		altspaceutil.manageBehavior(this, this.object3d);

		this.dataRequest = new THREE.FileLoader();
		this.dataRequest.setWithCredentials(true);

		if(this.userIds.length <= 0) {
			var self = this;
			altspace.getUser().then(function(user) {
				self.userIds.push(user.legacyUserId ? user.legacyUserId : user.userId);
				self.requestUserData();
			});
		}
		else {
			this.requestUserData();
		}
	}

	this.update = function(deltaTime) {
		if(!this.loading && this.userIds.length > 0) {
			this.time -= deltaTime;
			if(this.time <= 0) this.requestUserData();
		}
	}

	this.onLoaded = function(obj) {
		if(!this.loading) return;

		var json = JSON.parse(obj);
		var self = this;

		for(var jsonuser of json.users) {
			if(jsonuser && jsonuser.user_id) {
				var userId = jsonuser.user_id;

				var user = this.users[userId] || { userId: userId };
				this.users[userId] = user;

				var oldUsername = user.username;
				user.username = jsonuser.username || null;

				var oldDisplayName = user.displayName;
				user.displayName = jsonuser.display_name || null;

				var oldOnline = user.online;
				user.online = jsonuser.online || false;

				var jsonavatar = jsonuser.user_avatar.config.avatar;

				var oldAvatarId = user.avatarId;
				user.avatarId = jsonavatar.avatar_sid || null;

				var oldRawAvatarColors = user.rawAvatarColors;
				var oldAvatarTextures = user.avatarTextures;
				var avatarAppearanceChanged = (user.avatarId !== oldAvatarId);
				var avatarClass;

				switch(user.avatarId) {
					// Rubenoid Avatars
					case 'rubenoid-male-01':
					case 'rubenoid-female-01': {
						avatarClass = 'Rubenoid';
						var texturePrefix = (user.avatarId === 'rubenoid-male-01') ? 'rubenoid-male-texture-' : 'rubenoid-female-texture-';
						user.avatarTextures = { 'hair': jsonavatar[texturePrefix + '1'][0], 'skin': jsonavatar[texturePrefix + '2'][0], 'clothing': jsonavatar[texturePrefix + '3'][0] };
						user.avatarColors = {};
						user.rawAvatarColors = {};
						if(!avatarAppearanceChanged) avatarAppearanceChanged = (oldAvatarTextures['hair'] !== user.avatarTextures['hair'] || oldAvatarTextures['skin'] !== user.avatarTextures['skin'] || oldAvatarTextures['clothing'] !== user.avatarTextures['clothing']);
						break;
					}

					// Robothead Avatars
					case 'robothead-roundguy-01':
					case 'robothead-propellerhead-01': {
						avatarClass = 'Robothead';
						user.avatarColors = { 'highlight': this.getAvatarColor(jsonavatar['robothead-highlight-color']) };
						user.rawAvatarColors = { 'highlight': jsonavatar['robothead-highlight-color'] };
						user.avatarTextures = {};
						if(!avatarAppearanceChanged) avatarAppearanceChanged = (!oldRawAvatarColors['highlight'] || JSON.stringify(oldRawAvatarColors['highlight']) !== JSON.stringify(user.rawAvatarColors['highlight']));
						break;
					}

					// Pod Avatars
					case 'a-series-m01':
					case 'pod-classic':
					case 's-series-f01':
					case 's-series-m01':
					case 'x-series-m01':
					case 'x-series-m02': {
						avatarClass = 'Pod';
						user.avatarColors = { 'primary': this.getAvatarColor(jsonavatar['primary-color']), 'highlight': this.getAvatarColor(jsonavatar['highlight-color']) };
						user.rawAvatarColors = { 'primary': jsonavatar['primary-color'], 'highlight': jsonavatar['highlight-color'] };
						user.avatarTextures = {};
						if(!avatarAppearanceChanged) avatarAppearanceChanged = (!oldRawAvatarColors['primary'] || !oldRawAvatarColors['highlight'] || JSON.stringify(oldRawAvatarColors['primary']) !== JSON.stringify(user.rawAvatarColors['primary']) || JSON.stringify(oldRawAvatarColors['highlight']) !== JSON.stringify(user.rawAvatarColors['highlight']));
						break;
					}

					default: {
						avatarClass = '';
						user.avatarColors = {};
						user.rawAvatarColors = {};
						user.avatarTextures = {};
						if(this.trace) console.log('Unknown avatar type: ' + user.avatarId);
						break;
					}
				}

				if(user.username !== oldUsername || user.displayName !== oldDisplayName) {
					/**
					* Fires an event when the user changes account preferences.
					*
					* @event userchange
					* @property {String} userId User ID of the user.
					* @property {String} username Username of the user.
					* @property {String} displayName Display name of the user.
					* @property {THREE.Object3D} target - The object which emitted the event.
					* @memberof module:altspaceutil/behaviors.UserEvents
					*/
					this.object3d.dispatchEvent({
						type: 'userchange',
						detail: {
							userId: user.userId,
							username: user.username,
							displayName: user.displayName
						},
						bubbles: true,
						target: self.object3d
					});
				}

				if(avatarAppearanceChanged) {
					/**
					* Fires an event when the user changes avatar preferences.
					*
					* @event avatarchange
					* @property {String} userId User ID of the user.
					* @property {AvatarId} avatarId Avatar type identifier that was selected by the user.
					* @property {String} avatarClass Avatar type classification. Typically one of 'Pod',
					* 'Robothead' or 'Rubenoid', or empty when unclassified.
					* @property {Object} colors {@link THREE.Color} preferences of the avatar.  This typically provides
					* 'primary' and 'highlight' properties for Pod avatars, and 'highlight' for Robothead avatars.
					* @property {Object} rawColors Raw color preferences of the avatar.  This typically provides
					* 'primary' and 'highlight' properties for Pod avatars, and 'highlight' for Robothead avatars.
					* @property {Object} textures Texture identifier preferences for the avatar.  This typically provides
					* 'hair', 'skin' and 'clothing' properties for Rubenoid avatars.
					* @property {THREE.Object3D} target - The object which emitted the event.
					* @memberof module:altspaceutil/behaviors.UserEvents
					*/
					this.object3d.dispatchEvent({
						type: 'avatarchange',
						detail: {
							userId: user.userId,
							avatarId: user.avatarId,
							avatarClass: avatarClass,
							colors: user.avatarColors,
							rawColors: user.rawAvatarColors,
							textures: user.avatarTextures
						},
						bubbles: true,
						target: self.object3d
					});
				}

				if(user.online !== oldOnline) {
					/**
					* Fires an event when the user's connection status changes.
					*
					* @event avatarstatus
					* @property {String} userId User ID of the user.
					* @property {String} displayName Display name of the user.
					* @property {Boolean} online Specifies whether user is currently logged in.
					* @property {THREE.Object3D} target - The object which emitted the event.
					* @memberof module:altspaceutil/behaviors.UserEvents
					*/
					this.object3d.dispatchEvent({
						type: 'avatarstatus',
						detail: {
							userId: user.userId,
							displayName: user.displayName,
							online: (user.online ? true : false)
						},
						bubbles: true,
						target: self.object3d
					});
				}
			}
		}

		this.loading = false;
	}

	this.onError = function(xhr) {
		if(this.loading) {
			if(this.trace) {
				var url = xhr.target.responseURL || '';
				console.log('Error loading avatar data ' + url);
			}

			this.loading = false;
		}
	}

	/**
	* Subscribe to receiving events for a given User ID.
	*
	* @method subscribeUser
	* @param {String} userId - User ID to receive events for.
	* @memberof module:altspaceutil/behaviors.UserEvents
	*/
	this.subscribeUser = function(userId) {
		var index = this.userIds.indexOf(userId);
		if(index === -1) this.userIds.push(userId);
	}

	/**
	* Unsubscribe from receiving events for a given User ID.
	*
	* @method unsubscribeUser
	* @param {String} userId - User ID to stop receiving events for.
	* @memberof module:altspaceutil/behaviors.UserEvents
	*/
	this.unsubscribeUser = function(userId) {
		var index = this.userIds.indexOf(userId);
		if(index >= 0) this.userIds.splice(index, 1);
	}

	this.requestUserData = function() {
		if(!this.dataRequest || this.loading || this.userIds.length <= 0) return;

		var requestUserIds = [];
		for(var userId of this.userIds) {
			if(!this.onRequestData || this.onRequestData(userId, this.object3d)) requestUserIds.push(userId);
		}

		if(requestUserIds.length > 0) {
			// Authenticates Using Positron Session Exposed By AltspaceSDK
			// https://account.altvr.com/api/v1/users/<userid1>,<userid2>,...
			this.dataRequest.load('https://account.altvr.com/api/v1/users/' + requestUserIds.join(), this.onLoaded.bind(this), undefined, this.onError.bind(this));

			this.time = this.refreshTime;
			this.loading = true;
		}
	}

	this.getAvatarColor = function(color) {
		function getColorFromRGB(r, g, b) {
			// Normalize color values
			var maxColor = Math.max(r, g, b);
			if(maxColor > 255) {
				r = Math.floor(r / maxColor * 255);
				g = Math.floor(g / maxColor * 255);
				b = Math.floor(b / maxColor * 255);
			}

			return new THREE.Color(r / 255, g / 255, b / 255);
		}

		function getColorFromName(color) {
			var colorRGB = {
				'black': { r: 0.1, g: 0.1, b: 0.1 },
				'darkgrey': { r: 0.3, g: 0.3, b: 0.3 },
				'grey': { r: 0.75, g: 0.75, b: 0.75 },
				'white': { r: 1.0, g: 1.0, b: 1.0 }
			};

			color = (color in colorRGB) ? color : 'white';
			return new THREE.Color(colorRGB[color].r, colorRGB[color].g, colorRGB[color].b);
		}

		if(typeof(color[0]) === 'string') return getColorFromName(color[0]);
		return getColorFromRGB(color[0], color[1], color[2]);
	}

	this.dispose = function() {
		this.dataRequest = null;
		this.object3d = null;
		this.time = 0;
		this.loading = false;
		this.users = {};
	}

	this.clone = function() {
		return new altspaceutil.behaviors.UserEvents(this.config);
	}
}
/**
 * The PreloadNativeSounds behavior will load the specified sound files used by n-sound
 * to ensure the resources are cached for subsequent uses. The behavior will remove itself automatically 
 * once the sound files have been preloaded or the specified timeout threshold has been reached.
 *
 * @class PreloadNativeSounds
 * @param {Object[]} [sounds] Native sound resources to be preloaded.  Can either be an array of sound file paths or an array of [NativeComponent]{@link module:altspaceutil/behaviors.NativeComponent} n-sound data objects.
 * @param {Object} [config] Optional configuration properties
 * @param {Boolean} [config.dispose=true] Specifies whether the preloaded native sound objects will be destroyed after the preload has completed.  By default, preloaded sound objects will be destroyed after being cached.
 * @param {Number} [config.timeout=10000] Time in milliseconds to wait before ending the preload.  A [n-sound-preloaded] event will be fired with a timeout property set to true when the timeout threshold has been reached.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.PreloadNativeSounds = function(sounds, config) {
	this.type = 'PreloadSoundEffects';
	this.sounddata = sounds;
	this.config = Object.assign({ timeout: 10000, dispose: true }, config || {});

	this.awake = function(o) {
		this.object3d = o;
		this.elapsedTime = 0;
		this.preloadedCount = 0;
		this.isTimedOut = false;
		this.sounds = [];

		altspaceutil.manageBehavior(this, this.object3d);

		this.soundLoadedEventHandler = (function(event) {
			if(this.preloadedCount > 0) --this.preloadedCount;
			if(!this.isTimedOut && this.preloadedCount <= 0) {
				var self = this;

				/**
				* Fires an event once all sounds have been preloaded, or the specified timeout threshold has been reached.
				*
				* @event n-sound-preloaded
				* @property {PreloadNativeSounds} behavior The behavior that preloaded the sounds.
				* @property {THREE.Object3D[]} sounds The sound objects that were preloaded.
				* @property {Boolean} timeout Indicates whether the timeout threshold has been reached before all sounds were preloaded.
				* @memberof module:altspaceutil/behaviors.PreloadNativeSounds
				*/
				this.object3d.dispatchEvent({
					type: 'n-sound-preloaded',
					behavior: self,
					sounds: self.sounds,
					timeout: false,
					bubbles: true
				});

				this.object3d.removeBehavior(this);
			}
		}).bind(this);

		for(var sounddata of this.sounddata) {
			++this.preloadedCount;

			var obj = new THREE.Object3D();
			obj.addBehavior(new altspaceutil.behaviors.NativeComponent('n-sound', (typeof sounddata == 'string' || sounddata instanceof String) ? { src: sounddata } : sounddata));
			obj.addEventListener('n-sound-loaded', this.soundLoadedEventHandler);
			this.object3d.add(obj);
			this.sounds.push(obj);
		}
	}

	this.update = function(deltaTime) {
		this.elapsedTime += deltaTime;
		if(this.preloadedCount > 0 && !this.isTimedOut && this.config.timeout > 0 && this.elapsedTime >= this.config.timeout && this.object3d) {
			this.isTimedOut = true;

			var self = this;
			this.object3d.dispatchEvent({
				type: 'n-sound-preloaded',
				behavior: self,
				sounds: self.sounds,
				timeout: true,
				bubbles: true
			});

			this.object3d.removeBehavior(this);
		}
	}

	this.dispose = function() {
		for(var sound of this.sounds) {
			sound.removeEventListener('n-sound-loaded', this.soundLoadedEventHandler);
			if(this.config.dispose && sound.parent) sound.parent.remove(sound);
		}

		this.soundLoadedEventHandler = null;
		this.sounds = null;
		this.object3d = null;
		this.elapsedTime = 0;
		this.preloadedCount = 0;
	}

	this.clone = function() {
		return new altspaceutil.behaviors.PreloadNativeSounds(this.sounddata, this.config);
	}
}/**
 * The TransformControls behavior enables an object's position, rotation and scale to be manipulated
 * in AltspaceVR with a draggable transform gizmo.
 *
 * @class TransformControls
 * @param {Object} [config] Optional parameters.
 * @param {String} [config.controlType=none] The default control type to be selected.  Supported control types are 'none', 'position', 'rotate' or 'scale'.
 * @param {Boolean} [config.showButtons=false] Specifies whether buttons should be displayed to toggle between control types.
 * @param {Boolean} [config.followTarget=true] Specified whether the transform gizmo should follow the object that is being manipulated.
 * @param {THREE.Object3D} [config.target=null] The target that the transform gizmo should manipulate when interacted with.  If omitted, the object that the 
 * behavior is associated with will be used as the target.
 * @param {Number} [config.scale=1] Adjusts the scale of the transform gizmo.
 * @param {Boolean} [config.allowNegativeScale=false] Specifies whether the scale transform gizmo will allow the target's scale to be negative.
 * @param {Object} [config.positionAxisLock] Specifies which axes of the position gizmo can be displayed and manipulated.
 * @param {Boolean} [config.positionAxisLock.x=true] X axis of the position gizmo.
 * @param {Boolean} [config.positionAxisLock.y=true] Y axis of the position gizmo.
 * @param {Boolean} [config.positionAxisLock.z=true] Z axis of the position gizmo.
 * @param {Object} [config.rotateAxisLock] Specifies which axes of the rotate gizmo can be displayed and manipulated.
 * @param {Boolean} [config.rotateAxisLock.x=true] X axis of the rotate gizmo.
 * @param {Boolean} [config.rotateAxisLock.y=true] Y axis of the rotate gizmo.
 * @param {Boolean} [config.rotateAxisLock.z=true] Z axis of the rotate gizmo.
 * @param {Object} [config.scaleAxisLock] Specifies which axes of the scale gizmo can be displayed and manipulated.
 * @param {Boolean} [config.scaleAxisLock.x=true] X axis of the scale gizmo.
 * @param {Boolean} [config.scaleAxisLock.y=true] Y axis of the scale gizmo.
 * @param {Boolean} [config.scaleAxisLock.z=true] Z axis of the scale gizmo.
 * @param {Boolean} [config.disableColliders=true] Specifies whether colliders on the target object should be disabled.
 * @param {Boolean} [config.disableChildColliders=true] Specifies whether colliders on the target's children should be disabled.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.TransformControls = function(_config) {
	this.type = 'TransformControls';
	this.config = Object.assign({ controlType: 'none', showButtons: false, followTarget: true, target: null, scale: 1, allowNegativeScale: false, disableColliders: true, disableChildColliders: true }, _config);
	this.config.positionAxisLock = Object.assign({ x: true, y: true, z: true }, this.config.positionAxisLock);
	this.config.rotateAxisLock = Object.assign({ x: true, y: true, z: true }, this.config.rotateAxisLock);
	this.config.scaleAxisLock = Object.assign({ x: true, y: true, z: true }, this.config.scaleAxisLock);

	this.awake = function(o, s) {
		this.object3d = o;
		this.scene = s;
		this.target = this.config.target || this.object3d;

		if(!altspaceutil.behaviors.TransformControls.Materials) {
			altspaceutil.behaviors.TransformControls.Materials = {
				'red': new THREE.MeshBasicMaterial({ color: 0xFF0000 }),
				'green': new THREE.MeshBasicMaterial({ color: 0x00FF00 }),
				'blue': new THREE.MeshBasicMaterial({ color: 0x0000FF }),
				'yellow': new THREE.MeshBasicMaterial({ color: 0xFFFF00 }),
				'orange': new THREE.MeshBasicMaterial({ color: 0xFFCC00 }),
				'hidden': new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false }),
				'red-transclucent': new THREE.MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.2 }),
				'green-transclucent': new THREE.MeshBasicMaterial({ color: 0x00FF00, transparent: true, opacity: 0.2 }),
				'blue-transclucent': new THREE.MeshBasicMaterial({ color: 0x0000FF, transparent: true, opacity: 0.2 })
			};
		}

		if(!altspaceutil.behaviors.TransformControls.Geometries) {
			altspaceutil.behaviors.TransformControls.Geometries = {
				'button': new THREE.BoxBufferGeometry(0.2, 0.2, 0.2),
				'intersector': new THREE.PlaneBufferGeometry(100000, 100000)
			};
		}

		altspaceutil.manageBehavior(this, this.object3d);

		this.objectState = {};
		this.controls = { none: null, position: new THREE.Group(), rotate: new THREE.Group(), scale: new THREE.Group() };
		this.selectedControlType = this.config.controlType;
		this.selectedControl = null;
		this.controlTypeButtons = null;

		this.scene.addEventListener('cursormove', (function(event) {
			if(!this.selectedControl) {
				if(this.hoveredAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(child instanceof THREE.Mesh && child.userData.material) {
							child.material = child.userData.material;
							delete child.userData.material;
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
					this.hoveredAxis = null;
				}
				return;
			}

			this.raycaster.set(event.ray.origin, event.ray.direction);
			var intersection = this.raycaster.intersectObject(this.selectedControl, true)[0];

			// Remove Previous Hover Effects
			if(this.hoveredAxis && (!intersection || this.hoveredAxis !== intersection.object)) {
				if(!this.dragAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(child instanceof THREE.Mesh && child.userData.material) {
							child.material = child.userData.material;
							delete child.userData.material;
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}
				this.hoveredAxis = null;
			}

			if(intersection) {
				this.hoveredAxis = intersection.object;
				if(!this.dragAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(child instanceof THREE.Mesh && !child.userData.material && child.material.visible) {
							child.userData.material = child.material;
							child.material = altspaceutil.behaviors.TransformControls.Materials['orange'];
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}
			}
		}).bind(this));

		var createAxisOrigin = (function(name, color, size, lock) {
			return Object.assign(lock ? new THREE.Mesh(new THREE.BoxBufferGeometry(size.width, size.height, size.depth), altspaceutil.behaviors.TransformControls.Materials[color]) : new THREE.Group(), { name: name });
		}).bind(this);

		var createPositionAxis = (function(name, color, size, position, rotation, lock) {
			if(!lock) return Object.assign(new THREE.Object3D(), { name: name });

			if(altspaceutil.behaviors.TransformControls.Geometries['axis-position-' + name]) {
				var axis = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['axis-position-' + name].clone(), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
				axis.position.set(position.x, position.y, position.z);
				axis.rotation.set(rotation.x, rotation.y, rotation.z);

				return axis;
			}

			var axis = Object.assign(new THREE.Mesh(new THREE.BoxGeometry(size.width, size.height, size.depth), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
			axis.position.set(position.x, position.y, position.z);
			axis.rotation.set(rotation.x, rotation.y, rotation.z);

			var axisEnd = new THREE.Object3D();
			axisEnd.position.set(size.width / 2, 0, 0);
			axisEnd.rotation.set(0, 0, -Math.PI / 2);
			axisEnd.updateMatrix();

			var axisEndGeometry = new THREE.CylinderGeometry(0, size.depth * 2, size.depth * 4, 4, 1, false, Math.PI / 4);
			axisEndGeometry.applyMatrix(axisEnd.matrix);

			axis.geometry.merge(axisEndGeometry);
			axis.geometry = new THREE.BufferGeometry().fromGeometry(axis.geometry);

			altspaceutil.behaviors.TransformControls.Geometries['axis-position-' + name] = axis.geometry;

			return axis;
		}).bind(this);

		var createRotateAxis = (function(name, color, size, rotation, lock) {
			if(!lock) return Object.assign(new THREE.Object3D(), { name: name });

			if(!altspaceutil.behaviors.TransformControls.Geometries['axis-rotate-' + name]) altspaceutil.behaviors.TransformControls.Geometries['axis-rotate-' + name] = new THREE.RingBufferGeometry(size.radius * 0.8, size.radius * 1.5, 10, 1);

			var axis = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['axis-rotate-' + name], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: name });
			axis.rotation.set(rotation.x, rotation.y, rotation.z);
			var axisGizmo = Object.assign(new THREE.Mesh(new THREE.TorusBufferGeometry(size.radius, size.tube, size.radialSegments, size.tubularSegments), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
			axis.add(axisGizmo);
			return axis;
		}).bind(this);

		var createScaleAxis = (function(name, color, size, position, rotation, lock) {
			if(!lock) return Object.assign(new THREE.Object3D(), { name: name });

			if(altspaceutil.behaviors.TransformControls.Geometries['axis-scale-' + name]) {
				var axis = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['axis-scale-' + name].clone(), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
				axis.position.set(position.x, position.y, position.z);
				axis.rotation.set(rotation.x, rotation.y, rotation.z);

				return axis;
			}

			var axis = Object.assign(new THREE.Mesh(new THREE.BoxGeometry(size.width, size.height, size.depth), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
			axis.position.set(position.x, position.y, position.z);
			axis.rotation.set(rotation.x, rotation.y, rotation.z);

			var axisEnd = new THREE.Object3D();
			axisEnd.position.set(size.width / 2, 0, 0);
			axisEnd.rotation.set(0, 0, -Math.PI / 2);
			axisEnd.updateMatrix();

			var axisEndGeometry = new THREE.BoxGeometry(size.depth * 2, size.depth * 2, size.depth * 2);
			axisEndGeometry.applyMatrix(axisEnd.matrix);

			axis.geometry.merge(axisEndGeometry);
			axis.geometry = new THREE.BufferGeometry().fromGeometry(axis.geometry);

			altspaceutil.behaviors.TransformControls.Geometries['axis-scale-' + name] = axis.geometry;

			return axis;
		}).bind(this);

		// Position
		this.controls.position.name = 'position';
		this.controls.position.add(
			createAxisOrigin('xyz', 'yellow', { width: 0.15, height: 0.15, depth: 0.15 }, this.config.positionAxisLock.x || this.config.positionAxisLock.y || this.config.positionAxisLock.z).add(
				createPositionAxis('x', 'red', { width: 1, height: 0.05, depth: 0.05 }, { x: 0.5, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, this.config.positionAxisLock.x),
				createPositionAxis('y', 'green', { width: 1, height: 0.05, depth: 0.05 }, { x: 0, y: 0.5, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, this.config.positionAxisLock.y),
				createPositionAxis('z', 'blue', { width: 1, height: 0.05, depth: 0.05 }, { x: 0, y: 0, z: 0.5 }, { x: Math.PI / 2, y: 0, z: Math.PI / 2 }, this.config.positionAxisLock.z)
			)
		);

		// Rotate
		this.controls.rotate.name = 'rotate';
		this.controls.rotate.add(
			createAxisOrigin('xyz', 'yellow', { width: 0.05, height: 0.05, depth: 0.05 }, this.config.rotateAxisLock.x || this.config.rotateAxisLock.y || this.config.rotateAxisLock.z).add(
				createRotateAxis('x', 'red', { radius: 0.7, tube: 0.03, radialSegments: 8, tubularSegments: 28 }, { x: 0, y: Math.PI / 2, z: 0 }, this.config.rotateAxisLock.x),
				createRotateAxis('y', 'green', { radius: 0.7, tube: 0.03, radialSegments: 8, tubularSegments: 28 }, { x: Math.PI / 2, y: 0, z: 0 }, this.config.rotateAxisLock.y),
				createRotateAxis('z', 'blue',{ radius: 0.7, tube: 0.03, radialSegments: 8, tubularSegments: 28 }, { x: 0, y: 0, z: 0 }, this.config.rotateAxisLock.z)
			)
		);

		// Scale
		this.controls.scale.name = 'scale';
		this.controls.scale.add(
			createAxisOrigin('xyz', 'yellow', { width: 0.15, height: 0.15, depth: 0.15 }, this.config.scaleAxisLock.x || this.config.scaleAxisLock.y || this.config.scaleAxisLock.z).add(
				createScaleAxis('x', 'red', { width: 1, height: 0.05, depth: 0.05 }, { x: 0.5, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, this.config.scaleAxisLock.x),
				createScaleAxis('y', 'green', { width: 1, height: 0.05, depth: 0.05 }, { x:0, y: 0.5, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }, this.config.scaleAxisLock.y),
				createScaleAxis('z', 'blue', { width: 1, height: 0.05, depth: 0.05 }, { x: 0, y: 0, z: 0.5 }, { x: Math.PI / 2, y: 0, z: Math.PI / 2 }, this.config.scaleAxisLock.z)
			)
		);

		// Drag Events
		this.onDragBegin = (function(event) {
			this.dragAxis = null;

			if(!this.selectedControl) return;

			this.raycaster.set(event.ray.origin, event.ray.direction);
			var intersection = this.raycaster.intersectObject(this.selectedControl, true)[0];
			if(!intersection) return;

			this.dragAxis = intersection.object.name;

			// Remove Previous Hover Effects
			if(this.hoveredAxis) {
				this.hoveredAxis.traverse((function(child) {
					if(child instanceof THREE.Mesh && child.userData.material) {
						child.material = child.userData.material;
						delete child.userData.material;
						child.geometry.uvsNeedUpdate = true;
					}
				}).bind(this));
			}

			// Apply Dragged Hover Effect
			var dragHoverAxis = this.selectedControl.getObjectByName(this.dragAxis);
			if(dragHoverAxis) {
				dragHoverAxis.traverse((function(child) {
					if(child instanceof THREE.Mesh && !child.userData.material && child.material.visible) {
						child.userData.material = child.material;
						child.material = altspaceutil.behaviors.TransformControls.Materials['orange'];
						child.geometry.uvsNeedUpdate = true;
					}
				}).bind(this));
			}

			this.scene.updateMatrixWorld();
			this.dragPointBegin = intersection.point.clone();

			this.controlbase.removeEventListener('cursordown', this.onDragBegin);
			this.scene.addEventListener('cursorup', this.onDragEnd);
			this.scene.addEventListener('cursormove', this.onDragMove);

			this.intersector.quaternion.copy(this.selectedControl.getObjectByName(this.dragAxis).quaternion);

			if(this.dragAxis === 'xyz') {
				this.originIntersectors.traverse(function(child) {
					if(child instanceof THREE.Mesh) child.visible = true;
				});

				intersection = this.raycaster.intersectObjects([this.originIntersectors.children[0], this.originIntersectors.children[1], this.originIntersectors.children[2]], true)[0];
				this.originIntersector = (intersection && intersection.object) ? intersection.object : this.intersector;
				if(intersection) this.dragPointBegin = intersection.point.clone();

				this.originIntersectors.traverse(function(child) {
					if(child instanceof THREE.Mesh) child.visible = false;
				});
			}

			this.dispatchDragBeginEvent();
		}).bind(this);

		this.onDragMove = (function(event) {
			if(!this.selectedControl) {
				this.scene.removeEventListener('cursorup', this.onDragEnd);
				this.scene.removeEventListener('cursormove', this.onDragMove);
				this.controlbase.addEventListener('cursordown', this.onDragBegin);
				this.dragAxis = null;
				return;
			}

			var intersection;
			this.raycaster.set(event.ray.origin, event.ray.direction);

			if(this.dragAxis === 'xyz') {
				this.originIntersector.visible = true;
				intersection = this.raycaster.intersectObject(this.originIntersector, true)[0];
				this.originIntersector.visible = false;
			} else {
				this.intersector.quaternion.copy(this.selectedControl.getObjectByName(this.dragAxis).quaternion);
				this.intersector.visible = true;
				intersection = this.raycaster.intersectObject(this.intersector, true)[0];
				this.intersector.visible = false;
			}

			if(!intersection) return;

			var lastRotateDragDelta = this.dragPointBegin.clone().sub(this.object3d.position);
			var rotateDragDelta = intersection.point.clone().sub(this.object3d.position);
			var dragDelta = intersection.point.clone().sub(this.dragPointBegin);
			this.dragPointBegin = intersection.point.clone();
			var eventDragDelta = new THREE.Vector3();

			if(this.selectedControlType === 'position') {
				switch(this.dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						if(this.config.positionAxisLock[this.dragAxis]) {
							eventDragDelta[this.dragAxis] += dragDelta[this.dragAxis];
							this.target.position.add(eventDragDelta);
						}
						break;
					}
					case 'xyz': {
						if(this.config.positionAxisLock.x || this.config.positionAxisLock.y || this.config.positionAxisLock.z) {
							if(this.originIntersector.name === 'x') eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, this.config.positionAxisLock.y ? dragDelta.y : 0, 0);
							else if(this.originIntersector.name === 'y') eventDragDelta.set(0, this.config.positionAxisLock.y ? dragDelta.y : 0, this.config.positionAxisLock.z ? dragDelta.z : 0);
							else if(this.originIntersector.name === 'z') eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, 0, this.config.positionAxisLock.z ? dragDelta.z : 0);
							else eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, this.config.positionAxisLock.y ? dragDelta.y : 0, this.config.positionAxisLock.z ? dragDelta.z : 0);

							this.target.position.add(eventDragDelta);
						}
						break;
					}
				}
			} else if(this.selectedControlType === 'scale') {
				switch(this.dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						if(this.config.scaleAxisLock[this.dragAxis]) {
							eventDragDelta[this.dragAxis] += dragDelta[this.dragAxis];
							this.target.scale.add(eventDragDelta);

							if(this.target.scale[this.dragAxis] === undefined || isNaN(this.target.scale[this.dragAxis]) || (!this.config.allowNegativeScale && this.target.scale[this.dragAxis] < 0)) this.target.scale[this.dragAxis] = Number.EPSILON;
						}
						break;
					}
					default: {
						if(this.config.scaleAxisLock.x || this.config.scaleAxisLock.y || this.config.scaleAxisLock.z) {
							var maxScaleFactor = dragDelta.x;
							if(Math.abs(dragDelta.y) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.y;
							if(Math.abs(dragDelta.z) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.z;

							eventDragDelta.set(this.config.scaleAxisLock.x ? maxScaleFactor : 0, this.config.scaleAxisLock.y ? maxScaleFactor : 0, this.config.scaleAxisLock.z ? maxScaleFactor : 0);
							this.target.scale.add(eventDragDelta);

							if(this.target.scale.x === undefined || isNaN(this.target.scale.x) || (!this.config.allowNegativeScale && this.target.scale.x < 0)) this.target.scale.x = Number.EPSILON;
							if(this.target.scale.y === undefined || isNaN(this.target.scale.y) || (!this.config.allowNegativeScale && this.target.scale.y < 0)) this.target.scale.y = Number.EPSILON;
							if(this.target.scale.z === undefined || isNaN(this.target.scale.z) || (!this.config.allowNegativeScale && this.target.scale.z < 0)) this.target.scale.z = Number.EPSILON;
						}
						break;
					}
				}
			} else if(this.selectedControlType === 'rotate') {
				if(this.config.rotateAxisLock[this.dragAxis]) {
					switch(this.dragAxis) {
						case 'x': {
							var deltaRotation = Math.atan2(rotateDragDelta.z, rotateDragDelta.y) - Math.atan2(lastRotateDragDelta.z, lastRotateDragDelta.y);
							eventDragDelta[this.dragAxis] += deltaRotation;
							break;
						}
						case 'y': {
							var deltaRotation = Math.atan2(rotateDragDelta.x, rotateDragDelta.z) - Math.atan2(lastRotateDragDelta.x, lastRotateDragDelta.z);
							eventDragDelta[this.dragAxis] += deltaRotation;
							break;
						}
						case 'z': {
							var deltaRotation = Math.atan2(rotateDragDelta.y, rotateDragDelta.x) - Math.atan2(lastRotateDragDelta.y, lastRotateDragDelta.x);
							eventDragDelta[this.dragAxis] += deltaRotation;
							break;
						}
					}

					this.target.rotation[this.dragAxis] += eventDragDelta[this.dragAxis];
				}
			}

			this.updateTransform();
			this.dispatchDragMoveEvent(eventDragDelta);
		}).bind(this);

		this.onDragEnd = (function(event) {
			this.scene.removeEventListener('cursorup', this.onDragEnd);
			this.scene.removeEventListener('cursormove', this.onDragMove);
			this.controlbase.addEventListener('cursordown', this.onDragBegin);

			var dragAxis = this.dragAxis;
			this.dragAxis = null;

			if(this.selectedControl && dragAxis) {
				// Remove Dragged Hover Effect
				var dragHoverAxis = this.selectedControl.getObjectByName(dragAxis);
				if(dragHoverAxis) {
					dragHoverAxis.traverse((function(child) {
						if(child instanceof THREE.Mesh && child.userData.material) {
							child.material = child.userData.material;
							delete child.userData.material;
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}

				// Apply Previous Hover Effect
				if(this.hoveredAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(child instanceof THREE.Mesh && !child.userData.material && child.material.visible) {
							child.userData.material = child.material;
							child.material = altspaceutil.behaviors.TransformControls.Materials['orange'];
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}
			}

			if(!this.selectedControl) return;

			var intersection;
			this.raycaster.set(event.ray.origin, event.ray.direction);

			if(dragAxis === 'xyz') {
				this.originIntersector.visible = true;
				intersection = this.raycaster.intersectObject(this.originIntersector, true)[0];
				this.originIntersector.visible = false;
			} else {
				this.intersector.quaternion.copy(this.selectedControl.getObjectByName(dragAxis).quaternion);
				this.intersector.visible = true;
				intersection = this.raycaster.intersectObject(this.intersector, true)[0];
				this.intersector.visible = false;
			}

			if(!intersection) return;

			var lastRotateDragDelta = this.dragPointBegin.clone().sub(this.object3d.position);
			var rotateDragDelta = intersection.point.clone().sub(this.object3d.position);
			var dragDelta = intersection.point.clone().sub(this.dragPointBegin);
			this.dragPointBegin = intersection.point.clone();
			var eventDragDelta = new THREE.Vector3();

			if(this.selectedControlType === 'position') {
				switch(dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						if(this.config.positionAxisLock[dragAxis]) {
							eventDragDelta[dragAxis] += dragDelta[dragAxis];
							this.target.position.add(eventDragDelta);
						}
						break;
					}
					case 'xyz': {
						if(this.config.positionAxisLock.x || this.config.positionAxisLock.y || this.config.positionAxisLock.z) {
							if(this.originIntersector.name === 'x') eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, this.config.positionAxisLock.y ? dragDelta.y : 0, 0);
							else if(this.originIntersector.name === 'y') eventDragDelta.set(0, this.config.positionAxisLock.y ? dragDelta.y : 0, this.config.positionAxisLock.z ? dragDelta.z : 0);
							else if(this.originIntersector.name === 'z') eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, 0, this.config.positionAxisLock.z ? dragDelta.z : 0);
							else eventDragDelta.set(this.config.positionAxisLock.x ? dragDelta.x : 0, this.config.positionAxisLock.y ? dragDelta.y : 0, this.config.positionAxisLock.z ? dragDelta.z : 0);

							this.target.position.add(eventDragDelta);
						}
						break;
					}
				}
			} else if(this.selectedControlType === 'scale') {
				switch(dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						if(this.config.scaleAxisLock[dragAxis]) {
							eventDragDelta[dragAxis] += dragDelta[dragAxis];
							this.target.scale.add(eventDragDelta);

							if(this.target.scale[dragAxis] === undefined || isNaN(this.target.scale[dragAxis]) || (!this.config.allowNegativeScale && this.target.scale[dragAxis] < 0)) this.target.scale[dragAxis] = Number.EPSILON;
						}
						break;
					}
					default: {
						if(this.config.scaleAxisLock.x || this.config.scaleAxisLock.y || this.config.scaleAxisLock.z) {
							var maxScaleFactor = dragDelta.x;
							if(Math.abs(dragDelta.y) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.y;
							if(Math.abs(dragDelta.z) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.z;

							eventDragDelta.set(this.config.scaleAxisLock.x ? maxScaleFactor : 0, this.config.scaleAxisLock.y ? maxScaleFactor : 0, this.config.scaleAxisLock.z ? maxScaleFactor : 0);
							this.target.scale.add(eventDragDelta);

							if(this.target.scale.x === undefined || isNaN(this.target.scale.x) || (!this.config.allowNegativeScale && this.target.scale.x < 0)) this.target.scale.x = Number.EPSILON;
							if(this.target.scale.y === undefined || isNaN(this.target.scale.y) || (!this.config.allowNegativeScale && this.target.scale.y < 0)) this.target.scale.y = Number.EPSILON;
							if(this.target.scale.z === undefined || isNaN(this.target.scale.z) || (!this.config.allowNegativeScale && this.target.scale.z < 0)) this.target.scale.z = Number.EPSILON;
						}
						break;
					}
				}
			} else if(this.selectedControlType === 'rotate') {
				if(this.config.rotateAxisLock[dragAxis]) {
					switch(dragAxis) {
						case 'x': {
							var deltaRotation = Math.atan2(rotateDragDelta.z, rotateDragDelta.y) - Math.atan2(lastRotateDragDelta.z, lastRotateDragDelta.y);
							eventDragDelta[dragAxis] += deltaRotation;
							break;
						}
						case 'y': {
							var deltaRotation = Math.atan2(rotateDragDelta.x, rotateDragDelta.z) - Math.atan2(lastRotateDragDelta.x, lastRotateDragDelta.z);
							eventDragDelta[dragAxis] += deltaRotation;
							break;
						}
						case 'z': {
							var deltaRotation = Math.atan2(rotateDragDelta.y, rotateDragDelta.x) - Math.atan2(lastRotateDragDelta.y, lastRotateDragDelta.x);
							eventDragDelta[dragAxis] += deltaRotation;
							break;
						}
					}

					this.target.rotation[dragAxis] += eventDragDelta[dragAxis];
				}
			}

			this.updateTransform();
			this.dispatchDragMoveEvent(eventDragDelta);
			this.dispatchDragEndEvent(dragAxis);
		}).bind(this);

		// Control Type Toggle Buttons
		if(this.config.showButtons) {
			var onControlTypeButtonDown = (function(event) {
				this.buttonDownControlType = event.target.name;
			}).bind(this);

			var onControlTypeButtonUp = (function(event) {
				if(event.target.name !== this.buttonDownControlType) return;
				this.setActiveControl(this.buttonDownControlType === this.selectedControlType ? 'none' : this.buttonDownControlType);
			}).bind(this);

			this.controlTypeButtons = new THREE.Group();
			this.controlTypeButtons.position.set(0.5, 1, 0);

			var buttonPosition = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['button'], altspaceutil.behaviors.TransformControls.Materials['red-transclucent']), { name: 'position' });
			var buttonPositionIcon = this.controls.position.clone();
			buttonPositionIcon.position.set(-0.025, -0.025, -0.025);
			buttonPositionIcon.scale.multiplyScalar(0.1);
			buttonPosition.add(buttonPositionIcon);
			buttonPosition.addEventListener('cursordown', onControlTypeButtonDown);
			buttonPosition.addEventListener('cursorup', onControlTypeButtonUp);

			var buttonRotate = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['button'], altspaceutil.behaviors.TransformControls.Materials['green-transclucent']), { name: 'rotate' });
			var buttonRotateIcon = this.controls.rotate.clone();
			buttonRotateIcon.scale.multiplyScalar(0.1);
			buttonRotate.add(buttonRotateIcon);
			buttonRotate.position.set(0.25, 0, 0);
			buttonRotate.addEventListener('cursordown', onControlTypeButtonDown);
			buttonRotate.addEventListener('cursorup', onControlTypeButtonUp);

			var buttonScale = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['button'], altspaceutil.behaviors.TransformControls.Materials['blue-transclucent']), { name: 'scale' });
			var buttonScaleIcon = this.controls.scale.clone();
			buttonScaleIcon.position.set(-0.025, -0.025, -0.025);
			buttonScaleIcon.scale.multiplyScalar(0.1);
			buttonScale.add(buttonScaleIcon);
			buttonScale.position.set(0.5, 0, 0);
			buttonScale.addEventListener('cursordown', onControlTypeButtonDown);
			buttonScale.addEventListener('cursorup', onControlTypeButtonUp);

			this.controlTypeButtons.add(buttonPosition, buttonRotate, buttonScale);
		}

		// Raycaster & Intersection Plane For Drag Hit Testing
		this.raycaster = new THREE.Raycaster();

		this.intersector = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { visible: false });

		this.originIntersectors = new THREE.Group();
		this.originIntersectors.add(
			Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: 'x', visible: false }),
			Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: 'y', visible: false }),
			Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: 'z', visible: false })
		);
		this.originIntersectors.children[1].rotation.y = Math.PI / 2;
		this.originIntersectors.children[2].rotation.x = Math.PI / 2;

		// Group Transform Control Components Together
		this.controlbase = new THREE.Group();
		this.controlbase.add(this.controls.position, this.controls.rotate, this.controls.scale, this.intersector, this.originIntersectors);
		this.controlbase.traverse(function(child) {
			child.userData.isTransformControl = true;
			child.visible = false;
		});
		this.controlbase.addEventListener('cursordown', this.onDragBegin);
		this.scene.add(this.controlbase);
		this.controlbase.scale.setScalar(this.config.scale);
		if(this.controlTypeButtons) this.controlbase.add(this.controlTypeButtons);

		this.setActiveControl(this.selectedControlType);
	}

	this.dispatchDragMoveEvent = function(dragDelta) {
		if(dragDelta.x === 0 && dragDelta.y === 0 && dragDelta.z === 0) return;

		/**
		* Fires an event when the transform gizmo is being dragged.
		*
		* @event transform-controls-dragmove
		* @property {TransformControls} behavior The behavior that controls the transform gizmo.
		* @property {THREE.Object3D} parent The object that the transform gizmo is parented to.
		* @property {THREE.Object3D} transformTarget The object that the transform gizmo will manipulate.
		* @property {String} transformType - The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'.
		* @property {String} transformAxis - The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes).
		* @property {THREE.Vector3} transformDelta - The transform delta that was applied to the target object.
		* @memberof module:altspaceutil/behaviors.TransformControls
		*/
		var self = this;
		this.object3d.dispatchEvent({
			type: 'transform-controls-dragmove',
			detail: {
				behavior: self,
				parent: self.object3d,
				transformTarget: self.target,
				transformType: self.selectedControlType,
				transformAxis: self.dragAxis,
				transformDelta: dragDelta
			},
			bubbles: true,
			target: self.object3d
		});
	}

	this.dispatchDragBeginEvent = function() {
		/**
		* Fires an event when the transform gizmo starts being dragged.
		*
		* @event transform-controls-dragbegin
		* @property {TransformControls} behavior The behavior that controls the transform gizmo.
		* @property {THREE.Object3D} parent The object that the transform gizmo is parented to.
		* @property {THREE.Object3D} transformTarget The object that the transform gizmo will manipulate.
		* @property {String} transformType - The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'.
		* @property {String} transformAxis - The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes).
		* @memberof module:altspaceutil/behaviors.TransformControls
		*/
		var self = this;
		this.object3d.dispatchEvent({
			type: 'transform-controls-dragbegin',
			detail: {
				behavior: self,
				parent: self.object3d,
				transformTarget: self.target,
				transformType: self.selectedControlType,
				transformAxis: self.dragAxis
			},
			bubbles: true,
			target: self.object3d
		});
	}

	this.dispatchDragEndEvent = function(dragAxis) {
		var self = this;
		/**
		* Fires an event when the transform gizmo is no longer being dragged.
		*
		* @event transform-controls-dragend
		* @property {TransformControls} behavior The behavior that controls the transform gizmo.
		* @property {THREE.Object3D} parent The object that the transform gizmo is parented to.
		* @property {THREE.Object3D} transformTarget The object that the transform gizmo will manipulate.
		* @property {String} transformType - The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'.
		* @property {String} transformAxis - The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes).
		* @memberof module:altspaceutil/behaviors.TransformControls
		*/
		this.object3d.dispatchEvent({
			type: 'transform-controls-dragend',
			detail: {
				behavior: self,
				parent: self.object3d,
				transformTarget: self.target,
				transformType: self.selectedControlType,
				transformAxis: dragAxis
			},
			bubbles: true,
			target: self.object3d
		});
	}

	this.updateTransform = function() {
		// Transform Control Follows Object
		this.scene.updateMatrixWorld();
		this.controlbase.position.copy((this.config.followTarget ? this.target : this.object3d).getWorldPosition());
	}

	this.update = function() {
		this.updateTransform();

		// Remove Cursor Colliders
		if(this.target && (this.config.disableColliders || this.config.disableChildColliders)) {
			this.target.traverse((function(child) {
				if((child === this.target && !this.config.disableColliders) || (child !== this.target && !this.config.disableChildColliders)) return;

				if(!child.userData.isTransformControl && (!child.userData.altspace || !child.userData.altspace.collider || child.userData.altspace.collider.enabled)) {
					this.objectState[child.uuid] = Object.assign(this.objectState[child.uuid] || {}, { collider: { enabled: true } });
					child.userData.altspace = { collider: { enabled: false } };
				}
			}).bind(this));
		}
	}

	this.dispose = function() {
		this.setActiveControl('none');
		if(this.intersector && this.intersector.parent) this.intersector.parent.remove(this.intersector);
		if(this.controlTypeButtons && this.controlTypeButtons.parent) this.controlTypeButtons.parent.remove(this.controlTypeButtons);

		// Restore Cursor Colliders
		if(this.target && (this.config.disableColliders || this.config.disableChildColliders)) {
			this.target.traverse((function(child) {
				if((child === this.target && !this.config.disableColliders) || (child !== this.target && !this.config.disableChildColliders)) return;

				if(!child.userData.isTransformControl && this.objectState[child.uuid]) {
					child.userData.altspace = Object.assign(child.userData.altspace || {}, { collider: this.objectState[child.uuid].collider });
					delete this.objectState[child.uuid];
				}
			}).bind(this));
		}

		this.object3d = null;
		this.target = null;
		this.scene = null;
		this.objectState = null;
		this.controls = null;
		this.selectedControlType = null;
		this.selectedControl = null;
		this.controlbase = null;
		this.controlTypeButtons = null;
		this.buttonDownControlType = null;

		this.intersector = null;
		this.raycaster = null;
		this.originIntersectors = null;
		this.originIntersector = null;

		this.dragPointBegin = null;
		this.dragAxis = null;
		this.hoveredAxis = null;

		this.onDragBegin = null;
		this.onDragEnd = null;
		this.onDragMove = null;
	}

	/**
	* Sets the active control type.
	*
	* @method setActiveControl
	* @param {String} The active control type.  Possible values are 'none', 'position', 'rotate' and 'scale'.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.setActiveControl = function(controlType) {
		if(!this.controls && ['none', 'position', 'rotate', 'scale'].indexOf(controlType) >= 0) {
			this.config.controlType = controlType;
			return;
		}

		if(this.controls && this.object3d && this.target && this.controls.hasOwnProperty(controlType)) {
			if(this.selectedControl) {
				if(controlType === this.selectedControl.name) return;
				this.selectedControl.traverse(function(child) { child.visible = false; });
			} else {
				if(controlType === 'none') return;
			}

			this.selectedControl = this.controls[controlType];
			this.selectedControlType = this.selectedControl ? this.selectedControl.name : 'none';
			if(this.selectedControl) this.selectedControl.traverse(function(child) { child.visible = true; });

			this.update();
		}
	}

	/**
	* Gets the active control type.
	*
	* @method getActiveControl
	* @returns {String} The active control type.  Possible values are 'none', 'position', 'rotate' and 'scale'.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.getActiveControl = function() {
		return this.selectedControlType;
	}

	/**
	* Sets the target object that the transform gizmo will manipulate.
	*
	* @method setTarget
	* @param {THREE.Object3D} The target object that the transform gizmo will manipulate.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.setTarget = function(target) {
		// Restore Cursor Colliders
		if(this.target && (this.config.disableColliders || this.config.disableChildColliders)) {
			this.target.traverse((function(child) {
				if((child === this.target && !this.config.disableColliders) || (child !== this.target && !this.config.disableChildColliders)) return;

				if(!child.userData.isTransformControl && this.objectState[child.uuid]) {
					child.userData.altspace = Object.assign(child.userData.altspace || {}, { collider: this.objectState[child.uuid].collider });
					delete this.objectState[child.uuid];
				}
			}).bind(this));
		}

		this.target = this.config.target = target;

		// Remove Cursor Colliders
		if(this.target && (this.config.disableColliders || this.config.disableChildColliders)) {
			this.target.traverse((function(child) {
				if((child === this.target && !this.config.disableColliders) || (child !== this.target && !this.config.disableChildColliders)) return;

				if(!child.userData.isTransformControl && (!child.userData.altspace || !child.userData.altspace.collider || child.userData.altspace.collider.enabled)) {
					this.objectState[child.uuid] = Object.assign(this.objectState[child.uuid] || {}, { collider: { enabled: true } });
					child.userData.altspace = { collider: { enabled: false } };
				}
			}).bind(this));
		}
	}

	/**
	* Gets the target object that the transform gizmo will manipulate.
	*
	* @method getTarget
	* @returns {THREE.Object3D} The target object that the transform gizmo will manipulate.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.getTarget = function() {
		return this.target;
	}
}

// A-Frame Wrapper
/**
 * The altspace-transform-controls component enables an object's position, rotation and scale to be manipulated
 * in AltspaceVR with a draggable transform gizmo.
 *
 * @class altspace-transform-controls
 * @param {String} [control-type=none] The default control type to be selected.  Supported control types are 'none', 'position', 'rotate' or 'scale'.
 * @param {Boolean} [show-buttons=false] Specifies whether buttons should be displayed to toggle between control types.
 * @param {Boolean} [follow-target=true] Specified whether the transform gizmo should follow the object that is being manipulated.
 * @param {Selector} [target] The target that the transform gizmo should manipulate when interacted with.  If omitted, the object that the 
 * behavior is associated with will be used as the target.
 * @param {Number} [scale=1] Adjusts the scale of the transform gizmo.
 * @param {Boolean} [allow-negative-scale=false] Specifies whether the scale transform gizmo will allow the target's scale to be negative.
 * @param {Boolean} [sync-events=true] Specifies whether the sync ownership is gained when drag events are fired.  Requires {sync} and {sync-transform} 
 * components be present on the target object.
 * @param {String} [position-axis-lock=xyz] Specifies which axes of the position gizmo can be displayed and manipulated.
 * @param {String} [rotate-axis-lock=xyz] Specifies which axes of the rotate gizmo can be displayed and manipulated.
 * @param {String} [scale-axis-lock=xyz] Specifies which axes of the scale gizmo can be displayed and manipulated.
 * @param {Boolean} [disable-colliders=true] Specifies whether colliders on the target object should be disabled.
 * @param {Boolean} [disable-child-colliders=true] Specifies whether colliders on the target's children should be disabled.
 * @memberof module:altspaceutil/behaviors
 **/
if(window.AFRAME) {
	if(AFRAME.components['altspace-transform-controls']) delete AFRAME.components['altspace-transform-controls'];

	AFRAME.registerComponent('altspace-transform-controls', {
		schema: {
			controlType: { type: 'string', default: 'none' },
			showButtons: { type: 'boolean', default: false },
			followTarget: { type: 'boolean', default: true },
			target: { type: 'selector' },
			scale: { type: 'number', default: 1 },
			allowNegativeScale: { type: 'boolean', default: false },
			syncEvents: { type: 'boolean', default: true },
			positionAxisLock: {
				default: 'xyz',
				parse: function(value) {
					return { x: value.indexOf('x') !== -1, y: value.indexOf('y') !== -1, z: value.indexOf('z') !== -1 };
				}
			},
			rotateAxisLock: {
				default: 'xyz',
				parse: function(value) {
					return { x: value.indexOf('x') !== -1, y: value.indexOf('y') !== -1, z: value.indexOf('z') !== -1 };
				}
			},
			scaleAxisLock: {
				default: 'xyz',
				parse: function(value) {
					return { x: value.indexOf('x') !== -1, y: value.indexOf('y') !== -1, z: value.indexOf('z') !== -1 };
				}
			},
			disableColliders: { type: 'boolean', default: true },
			disableChildColliders: { type: 'boolean', default: true }
		},
		init: function() {
			this.behavior = new altspaceutil.behaviors.TransformControls({
				controlType: this.data.controlType,
				showButtons: this.data.showButtons,
				followTarget: this.data.followTarget,
				target: this.data.target ? this.data.target.object3D : null,
				scale: this.data.scale,
				allowNegativeScale: this.data.allowNegativeScale,
				positionAxisLock: this.data.positionAxisLock,
				rotateAxisLock: this.data.rotateAxisLock,
				scaleAxisLock: this.data.scaleAxisLock,
				disableColliders: this.data.disableColliders,
				disableChildColliders: this.data.disableChildColliders
			});
			this.el.object3D.addBehavior(this.behavior);

			// Handle Sync System Ownership When Gizmo Is Dragged
			if(this.data.syncEvents) {
				var onDragEvent = (function(event) {
					var target = this.el.object3D.getBehaviorByType('TransformControls').getTarget().el;
					if(target && target.components.sync && target.components.sync.isConnected) {
						target.components.sync.takeOwnership();
						target.setAttribute('position', target.object3D.position);
						target.setAttribute('rotation', { x: THREE.Math.radToDeg(target.object3D.rotation.x), y: THREE.Math.radToDeg(target.object3D.rotation.y), z: THREE.Math.radToDeg(target.object3D.rotation.z) });
						target.setAttribute('scale', target.object3D.scale);
					}
				}).bind(this);

				this.el.object3D.addEventListener('transform-controls-dragbegin', onDragEvent);
				this.el.object3D.addEventListener('transform-controls-dragmove', onDragEvent);
				this.el.object3D.addEventListener('transform-controls-dragend', onDragEvent);
			}
		},
		remove: function() {
			if(this.behavior) this.el.object3D.removeBehavior(this.behavior);
		}
	});
}/**
 * Changes the color of an object's material when the cursor hovers over it, and restores the original color when the cursor is no longer hovering over the object.
 * 
 * @class HoverMaterialColor
 * @param {Object} [config] Optional parameters.
 * @param {THREE.Material} [config.material] A reference to the material whose color will be updated.  Defaults to material of the object the behavior is attached to.
 * @param {THREE.Color} [config.color=new THREE.Color('yellow')] The value that will be applied to the object's material color when the cursor hovers over it.
 * @param {Number} [config.beginDuration=75] Duration the hovered color adjustment effect is intended to take to complete, in milliseconds.
 * @param {Number} [config.endDuration=75] Duration the unhovered color adjustment effect is intended to take to complete, in milliseconds.
 * @param {Boolean} [config.revertOnDispose=true] Specifies whether the object's original material color should be restored when the behavior has been destroyed.
 * @param {THREE.Object3D} [config.eventListener=null] Specifies an optional object that will listen for cursor events.  By default the object that the behavior is attached to will be used as the event listener.
 * @param {Boolean} [config.hoverChildren=true] Specifies whether hovering over children of the event listener object should invoke the hover effect.
 * @memberof module:altspace/utilities/behaviors
 */
altspaceutil.behaviors.HoverMaterialColor = function(config) {
	config = config || {};

	this.type = 'HoverMaterialColor';

	this.awake = function(o) {
		this.color = config.color || new THREE.Color('yellow');
		this.beginDuration = config.beginDuration || 75; // Milliseconds
		this.endDuration = config.endDuration || 75; // Milliseconds
		this.revertOnDispose = ((config.revertOnDispose !== undefined) ? config.revertOnDispose : true);
		this.hoverChildren = ((config.hoverChildren !== undefined) ? config.hoverChildren : true);

		this.object3d = o;
		this.eventListener = config.eventListener || this.object3d;
		this.material = config.material || this.object3d.material;
		this.originalColor = this.material.color.clone();

		this.srcColor = this.color;
		this.destColor = this.originalColor;

		this.srcDuration = this.beginDuration;
		this.destDuration = this.endDuration;
		this.duration = this.destDuration;

		this.progress = 1;
		this.elapsedTime = this.duration;

		this.eventListener.addEventListener('cursorenter', this.onHoverStateChange.bind(this));
		this.eventListener.addEventListener('cursorleave', this.onHoverStateChange.bind(this));
	}

	this.update = function(deltaTime) {
		if(this.progress < 1) {
			this.elapsedTime += deltaTime;
			this.elapsedTime = THREE.Math.clamp(this.elapsedTime, 0, this.duration);

			this.progress = THREE.Math.clamp(this.elapsedTime / this.duration, 0, 1);
			this.material.color.copy(this.srcColor).lerp(this.destColor, this.progress);
		}
	}

	this.dispose = function() {
		this.eventListener.removeEventListener('cursorenter', this.onHoverStateChange.bind(this));
		this.eventListener.removeEventListener('cursorleave', this.onHoverStateChange.bind(this));

		// Restore Original Object Material Color Before Behavior Was Applied
		if(this.revertOnDispose) this.material.color.copy(this.originalColor);
	}

	this.onHoverStateChange = function(event) {
		if(!this.hoverChildren && this.eventListener !== event.target) return;

		var temp = this.srcColor;
		this.srcColor = this.destColor;
		this.destColor = temp;

		var temp = this.srcDuration;
		this.srcDuration = this.destDuration;
		this.destDuration = temp;
		this.duration = this.destDuration;

		this.progress = 1 - this.progress;
		this.elapsedTime = this.duration * this.progress;
	}
}
/**
 * Changes the opacity of an object's material when the cursor hovers over it, and restores the original opacity when the cursor is no longer hovering over the object.
 * 
 * @class HoverMaterialOpacity
 * @param {Object} [config] Optional parameters.
 * @param {THREE.Material} [config.material] A reference to the material whose opacity will be updated.  Defaults to material of the object the behavior is attached to.
 * @param {Number} [config.opacity=1] The value that will be applied to the object's material opacity when the cursor hovers over it.
 * @param {Number} [config.beginDuration=75] Duration the hovered opacity adjustment effect is intended to take to complete, in milliseconds.
 * @param {Number} [config.endDuration=75] Duration the unhovered opacity adjustment effect is intended to take to complete, in milliseconds.
 * @param {Boolean} [config.revertOnDispose=true] Specifies whether the object's original material opacity should be restored when the behavior has been destroyed.
 * @param {THREE.Object3D} [config.eventListener=null] Specifies an optional object that will listen for cursor events.  By default the object that the behavior is attached to will be used as the event listener.
 * @param {Boolean} [config.hoverChildren=true] Specifies whether hovering over children of the event listener object should invoke the hover effect.
 * @memberof module:altspace/utilities/behaviors
 */
altspaceutil.behaviors.HoverMaterialOpacity = function(config) {
	config = config || {};

	this.type = 'HoverMaterialOpacity';

	this.awake = function(o) {
		this.opacity = config.opacity || 1;
		this.beginDuration = config.beginDuration || 75; // Milliseconds
		this.endDuration = config.endDuration || 75; // Milliseconds
		this.revertOnDispose = ((config.revertOnDispose !== undefined) ? config.revertOnDispose : true);
		this.hoverChildren = ((config.hoverChildren !== undefined) ? config.hoverChildren : true);

		this.object3d = o;
		this.eventListener = config.eventListener || this.object3d;
		this.material = config.material || this.object3d.material;
		this.originalOpacity = this.material.opacity;

		this.srcOpacity = THREE.Math.clamp(this.originalOpacity + this.opacity, 0, 1);
		this.destOpacity = this.originalOpacity;

		this.srcDuration = this.beginDuration;
		this.destDuration = this.endDuration;
		this.duration = this.destDuration;

		this.progress = 1;
		this.elapsedTime = this.duration;

		this.eventListener.addEventListener('cursorenter', this.onHoverStateChange.bind(this));
		this.eventListener.addEventListener('cursorleave', this.onHoverStateChange.bind(this));
	}

	this.update = function(deltaTime) {
		if(this.progress < 1) {
			this.elapsedTime += deltaTime;
			this.elapsedTime = THREE.Math.clamp(this.elapsedTime, 0, this.duration);

			this.progress = THREE.Math.clamp(this.elapsedTime / this.duration, 0, 1);
			this.material.opacity = THREE.Math.lerp(this.srcOpacity, this.destOpacity, this.progress);
		}
	}

	this.dispose = function() {
		this.eventListener.removeEventListener('cursorenter', this.onHoverStateChange.bind(this));
		this.eventListener.removeEventListener('cursorleave', this.onHoverStateChange.bind(this));

		// Restore Original Object Material Opacity Before Behavior Was Applied
		if(this.revertOnDispose) this.material.opacity = this.originalOpacity;
	}

	this.onHoverStateChange = function(event) {
		if(!this.hoverChildren && this.eventListener !== event.target) return;

		var temp = this.srcOpacity;
		this.srcOpacity = this.destOpacity;
		this.destOpacity = temp;

		var temp = this.srcDuration;
		this.srcDuration = this.destDuration;
		this.destDuration = temp;
		this.duration = this.destDuration;

		this.progress = 1 - this.progress;
		this.elapsedTime = this.duration * this.progress;
	}
}
/**
 * Updates the color and opacity of a n-text native component using a material source.
 * 
 * @class NativeTextMaterial
 * @param {Object} [config] Optional parameters.
 * @param {THREE.Material} [config.material=null] A reference to the material whose properties will be applied to the n-text native component.  Defaults to material of the object the behavior is attached to.
 * @param {Boolean} [config.color=true] Specifies whether the n-text native component should use the color of the source material.
 * @param {Boolean} [config.opacity=true] Specifies whether the n-text native component should use the opacity of the source material.
 * @memberof module:altspace/utilities/behaviors
 */
altspaceutil.behaviors.NativeTextMaterial = function(config) {
	config = config || {};

	this.type = 'NativeTextMaterial';

	this.awake = function(o) {
		this.object3d = o;
		this.component = this.object3d.getBehaviorByType('n-text');
		this.material = config.material || this.object3d.material || new THREE.MeshBasicMaterial({ transparent: true });
		this.hasColor = ((config.color !== undefined) ? config.color : true);
		this.hasOpacity = ((config.opacity !== undefined) ? config.opacity : true);
	}

	this.update = function(deltaTime) {
		this.removeMaterialTags();
		this.component.data.text = this.getMaterialTags() + this.component.data.text;
	}

	this.dispose = function() {
		this.removeMaterialTags();
	}

	this.removeMaterialTags = function() {
		var tagBegin = this.component.data.text.indexOf('<link id="n-text-material">');
		var tagEnd = tagBegin >= 0 ? this.component.data.text.indexOf('</link>', tagBegin) : -1;
		if(tagBegin >= 0 && tagEnd >= 0) this.component.data.text = this.component.data.text.slice(0, tagBegin) + this.component.data.text.slice(tagEnd + 7);
	}

	this.getMaterialTags = function() {
		var hexOpacity = (+Math.floor(this.hasOpacity && this.material.transparent ? this.material.opacity * 255 : 255)).toString(16).toUpperCase();
		if(hexOpacity.length < 2) hexOpacity = '0' + hexOpacity;

		var tags = '<link id="n-text-material">';
		if(this.hasColor) tags += '<color=#' + this.material.color.getHexString() + hexOpacity + '>';
		else if(this.hasOpacity) tags += '<alpha=#' + hexOpacity + '>';
		tags += '</link>';

		return tags;
	}
}

/**
 * The n-text-material component updates the color and opacity of a {n-text} native component using a material source.
 *
 * @class n-text-material
 * @param {Selector} [material] A reference to the object whose material properties will be applied to the n-text native component.  Defaults to material of the object the component is attached to.
 * @param {Boolean} [color=true] Specifies whether the n-text native component should use the color of the source material.
 * @param {Boolean} [opacity=true] Specifies whether the n-text native component should use the opacity of the source material.
 * @memberof module:altspaceutil/behaviors
 **/
if(window.AFRAME) {
	if(AFRAME.components['n-text-material']) delete AFRAME.components['n-text-material'];

	AFRAME.registerComponent('n-text-material', {
		dependencies: ['n-text'],
		schema: {
			material: { type: 'selector' },
			color: { type: 'boolean', default: true },
			opacity: { type: 'boolean', default: true }
		},
		init: function() {
			this.component = this.el.getAttribute('n-text');
			this.material = this.data.material ? this.data.material.object3DMap.mesh.material : this.el.object3DMap.mesh.material;
		},
		remove: function() {
			this.removeMaterialTags();
		},
		tick: function(deltaTime) {
			this.removeMaterialTags();
			this.el.setAttribute('n-text', 'text', this.getMaterialTags() + this.component.text);
		},
		removeMaterialTags: function() {
			var tagBegin = this.component.text.indexOf('<link id="n-text-material">');
			var tagEnd = tagBegin >= 0 ? this.component.text.indexOf('</link>', tagBegin) : -1;
			if(tagBegin >= 0 && tagEnd >= 0) this.component.text = this.component.text.slice(0, tagBegin) + this.component.text.slice(tagEnd + 7);
		},
		getMaterialTags: function() {
			var hexOpacity = (+Math.floor(this.data.opacity && this.material.transparent ? this.material.opacity * 255 : 255)).toString(16).toUpperCase();
			if(hexOpacity.length < 2) hexOpacity = '0' + hexOpacity;

			var tags = '<link id="n-text-material">';
			if(this.data.color) tags += '<color=#' + this.material.color.getHexString() + hexOpacity + '>';
			else if(this.data.opacity) tags += '<alpha=#' + hexOpacity + '>';
			tags += '</link>';

			return tags;
		}
	});
}
