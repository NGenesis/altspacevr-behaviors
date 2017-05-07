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

altspaceutil.getObject3DById = function(meshId) {
	return (altspace.inClient && altspace._internal) ? altspace._internal.getObject3DById(meshId) : null;
}

altspaceutil.getThreeJSScene = function(meshId) {
	return (altspace.inClient && altspace._internal) ? altspace._internal.getThreeJSScene() : null;
}

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
		initComponent: initCollisionEventHandler
	},

	'n-box-collider': {
		data: {
			isTrigger: false,
			center: { 'x': 0, 'y': 0, 'z': 0 },
			size: { 'x': 0, 'y': 0, 'z': 0 },
			type: 'environment'
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
			inheritParentData: true
		},
		initComponent: initCollisionEventHandler
	},

	'n-container': {
		data: {
			capacity: 4
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
				// Handle Sound Loaded
				this.nativeEvents['NativeSoundLoadedEvent'] = altspaceutil.addNativeEventListener('NativeSoundLoadedEvent', (function(meshId, count, oldCount) {
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
		},
		update: function() {
			altspace.updateNativeComponent(this.component, this.type, this.data);

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
			inheritParentData: true
		}
	},

	'n-cockpit-parent': {
		config: {
			sendUpdates: false
		}
	},

	'n-billboard': {
		config: {
			sendUpdates: false
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

			altspace.updateNativeComponent(this.component, this.type, this.data);
		}
	},

	'n-gltf': {
		data: {
			url: ''
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
				console.log(event);
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
				console.log(event);
			}
		}).bind(this));
	}
}

altspaceutil.behaviors.NativeComponent = function(_type, _data, _config) {
	this.type = _type || 'NativeComponent';

	this.nativeEvents = {};
	this.defaults = altspaceutil.behaviors.NativeComponentDefaults[this.type];
	this.config = Object.assign({ sendUpdates: true, recursiveMesh: false, recursive: false, useCollider: false, updateOnStaleData: true, sharedComponent: true, inheritParentData: false }, (this.defaults && this.defaults.config) ? JSON.parse(JSON.stringify(this.defaults.config)) : {}, _config);
	this.data = Object.assign((this.defaults && this.defaults.data) ? JSON.parse(JSON.stringify(this.defaults.data)) : {}, _data);

	this.awake = function(o, s) {
		this.scene = s;
		this.component = this.object3d = o;

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
				this.sharedData.placeholder = this.sharedData.placeholder || new THREE.Mesh(new THREE.BoxBufferGeometry(0.001, 0.001, 0.001), Object.assign(new THREE.MeshBasicMaterial(), { visible: false }));
				this.sharedData.behaviors = this.sharedData.behaviors || [];
				this.sharedData.behaviors.push(this);
				if(!this.sharedData.placeholder.parent) this.object3d.add(this.sharedData.placeholder);
			}

			this.component = this.placeholder = (this.sharedData && this.sharedData.placeholder) ? this.sharedData.placeholder : new THREE.Mesh(new THREE.BoxBufferGeometry(0.001, 0.001, 0.001), Object.assign(new THREE.MeshBasicMaterial(), { visible: false }));
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

		if(altspace.inClient) altspace.addNativeComponent(this.component, this.type);
		this.update();

		// Add Component To Descendants
		if((this.config.recursive || this.config.recursiveMesh) && (!this.parent || linkedParent)) {
			this.object3d.traverse((function(child) {
				if(child !== this.object3d && child !== this.placeholder && (this.config.recursive || (this.config.recursiveMesh && child instanceof THREE.Mesh))) {
					child.addBehavior(Object.assign(new altspaceutil.behaviors.NativeComponent(this.type, this.data, this.config), { parent: this }));
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

		if(altspace.inClient && this.config.sendUpdates) {
			if(this.config.updateOnStaleData) {
				var newData = JSON.stringify(this.data);
				if(this.oldData !== newData) {
					if(this.defaults && this.defaults.update) {
						this.defaults.update.bind(this)();
					} else {
						altspace.updateNativeComponent(this.component, this.type, this.data);
					}
					this.oldData = newData;
				}
			} else {
				if(this.defaults && this.defaults.update) {
					this.defaults.update.bind(this)();
				} else {
					altspace.updateNativeComponent(this.component, this.type, this.data);
				}
			}
		}
	}

	this.callComponent = function(functionName, functionArgs) {
		if(altspace.inClient) altspace.callNativeComponent(this.component, this.type, functionName, functionArgs);
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

		if(altspace.inClient) altspace.removeNativeComponent(this.component, this.type);

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
		this.component = this.object3d.getBehaviorByType(this.componentType);
		this.sync = this.config.syncRef || this.object3d.getBehaviorByType('Object3DSync');
		this.dataRef = this.sync.dataRef.child(this.componentType).child('data');

		this.dataRef.on('value', (function(snapshot) {
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
	}
}