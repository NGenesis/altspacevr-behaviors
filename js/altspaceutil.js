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

altspaceutil.getThreeJSScene = function(meshId) {
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
		initComponent: function() {
			this.count = 0;

			if(altspace.inClient) {
				// Handle Container Count Changes
				this.nativeEvents['NativeContainerCountChanged'] = altspaceutil.addNativeEventListener('NativeContainerCountChanged', (function(meshId, count, oldCount) {
					var object3d = altspaceutil.getObject3DById(meshId);
					if(object3d && object3d === this.component) {
						/**
						* The number of objects in the n-container.
						* @instance
						* @member {Number} count
						* @readonly
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						this.count = count;

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
		callComponent: function(functionName, functionArgs) {
			if(this.component) {
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
			}
		},
		update: function() {
			if(this.initialized) altspace.updateNativeComponent(this.component, this.type, this.data);

			if(this.playHandlerType) {
				this.component.removeEventListener(this.playHandlerType, this.playHandler);
				this.playHandlerType = null;
			}

			if(this.data.on && this.data.on !== '') {
				if(this.playHandler === undefined) this.playHandler = this.callComponent.bind(this, 'play');
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
		initComponent: function() {
			this.data.url = altspaceutil.getAbsoluteURL(this.data.url);
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

altspaceutil.behaviors.NativeComponent = function(_type, _data, _config) {
	this.type = _type || 'NativeComponent';

	this.nativeEvents = {};
	this.defaults = altspaceutil.behaviors.NativeComponentDefaults[this.type];
	this.config = Object.assign({ sendUpdates: true, recursiveMesh: false, recursive: false, useCollider: false, updateOnStaleData: true, sharedComponent: true, inheritParentData: false, meshComponent: false }, (this.defaults && this.defaults.config) ? JSON.parse(JSON.stringify(this.defaults.config)) : {}, _config);
	this.data = Object.assign((this.defaults && this.defaults.data) ? JSON.parse(JSON.stringify(this.defaults.data)) : {}, _data);

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

	this.callComponent = function(functionName, functionArgs) {
		if(this.initialized) altspace.callNativeComponent(this.component, this.type, functionName, functionArgs);
		if(this.defaults && this.defaults.callComponent) this.defaults.callComponent.bind(this)(functionName, functionArgs);

		if(this.config.recursive || this.config.recursiveMesh && !this.parent) {
			this.object3d.traverse((function(child) {
				if(child !== this.object3d && child !== this.placeholder && (this.config.recursive || (this.config.recursiveMesh && child instanceof THREE.Mesh))) {
					var childComponent = child.getBehaviorByType(this.type);
					if(childComponent && childComponent.parent === this) child.callComponent(functionName, functionArgs);
				}
			}).bind(this));
		}
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
				self.userIds.push(user.userId);
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

				var oldAvatarColors = user.avatarColors;
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
						if(!avatarAppearanceChanged) avatarAppearanceChanged = (oldAvatarTextures['hair'] !== user.avatarTextures['hair'] || oldAvatarTextures['skin'] !== user.avatarTextures['skin'] || oldAvatarTextures['clothing'] !== user.avatarTextures['clothing']);
						break;
					}

					// Robothead Avatars
					case 'robothead-roundguy-01':
					case 'robothead-propellerhead-01': {
						avatarClass = 'Robothead';
						user.avatarColors = { 'highlight': this.getAvatarColor(jsonavatar['robothead-highlight-color']) };
						user.avatarTextures = {};
						if(!avatarAppearanceChanged) avatarAppearanceChanged = (!oldAvatarColors['highlight'] || !oldAvatarColors['highlight'].equals(user.avatarColors['highlight']));
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
						user.avatarTextures = {};
						if(!avatarAppearanceChanged) avatarAppearanceChanged = (!oldAvatarColors['primary'] || !oldAvatarColors['highlight'] || !oldAvatarColors['primary'].equals(user.avatarColors['primary']) || !oldAvatarColors['highlight'].equals(user.avatarColors['highlight']));
						break;
					}

					default: {
						avatarClass = '';
						user.avatarColors = {};
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
	* Subscribe to receiving events for a given User ID
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
	* Unsubscribe from receiving events for a given User ID
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
 * The PreloadNativeSounds behavior will silently load and play the specified sound
 * files used by n-sound to ensure the resources are cached for subsequent uses.
 * The behavior will remove itself automatically once the sound files have been preloaded.
 *
 * @class PreloadNativeSounds
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.PreloadNativeSounds = function(sounds) {
	this.type = 'PreloadSoundEffects';
	this.sounds = sounds;

	this.awake = function(o) {
		this.object3d = o;
		this.elapsedTime = 0;

		altspaceutil.manageBehavior(this, this.object3d);

		this.components = new THREE.Group();
		this.object3d.add(this.components);
		for(var sound of this.sounds) this.components.addBehavior(new altspaceutil.behaviors.NativeComponent('n-sound', { src: sound, volume: 0, oneshot: true, autoplay: true }));
	}

	this.update = function(deltaTime) {
		this.elapsedTime += deltaTime;
		if(this.elapsedTime >= 10000 && this.object3d) this.object3d.removeBehavior(this);
	}

	this.dispose = function() {
		if(this.components && this.components.parent) this.components.parent.remove(this.components);
		this.components = null;
		this.object3d = null;
		this.elapsedTime = 0;
	}

	this.clone = function() {
		return new altspaceutil.behaviors.PreloadNativeSounds(this.sounds);
	}
}
