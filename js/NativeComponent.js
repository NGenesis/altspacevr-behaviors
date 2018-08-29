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
		},
		initComponent: function() {
			if(!altspace.inClient) {
				this.config.meshComponent = false;
				this.shimbehavior = new altspaceutil.behaviors.Text({ text: this.data.text, fontSize: this.data.fontSize, width: this.data.width, height: this.data.height, horizontalAlign: this.data.horizontalAlign, verticalAlign: this.data.verticalAlign, native: false });
				this.object3d.addBehavior(this.shimbehavior);
			}
		},
		shimUpdate: function() {
			if(!altspace.inClient && this.shimbehavior) {
				this.shimbehavior.config.text = this.data.text;
				this.shimbehavior.config.fontSize = this.data.fontSize;
				this.shimbehavior.config.width = this.data.width;
				this.shimbehavior.config.height = this.data.height;
				this.shimbehavior.config.horizontalAlign = this.data.horizontalAlign;
				this.shimbehavior.config.verticalAlign = this.data.verticalAlign;
			}
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
						if(object3D && object3D.el) object3D.el.emit('n-sound-loaded', null, true);
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
		},
		initComponent: function() {
			if(!altspace.inClient) {
				this.config.meshComponent = false;
				this.shimbehavior = new altspaceutil.behaviors.Billboard({ y: false, native: false });
				this.object3d.addBehavior(this.shimbehavior);
			}
		}
	},

	'n-animator': {
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
				this.data.targetPosition = this.config.targetEntity.getWorldPosition(new THREE.Vector3());
				var quaternion = this.config.targetEntity.getWorldQuaternion(new THREE.Quaternion());
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
						if(object3D && object3D.el) object3D.el.emit('n-gltf-loaded', null, true);
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

				// Forward Events From Placeholder To Behavior Owner
				if(this.placeholder) {
					var forwardPlaceholderEvent = (function(event) {
						this.object3d.dispatchEvent(event);
					}).bind(this);
					this.placeholder.addEventListener('n-gltf-loaded', forwardPlaceholderEvent);
				}
			} else {
				this.shimbehavior = new altspaceutil.behaviors.GLTF({ url: this.data.url, sceneIndex: this.data.sceneIndex, native: false });
				this.object3d.addEventListener('gltf-loaded', () => {
					this.attributes.loaded = true;
					this.object3d.dispatchEvent({
						type: 'n-gltf-loaded',
						bubbles: true,
						target: this.object3d
					});
				});
				this.object3d.addBehavior(this.shimbehavior);
			}
		},
		update: function() {
			this.data.url = altspaceutil.getAbsoluteURL(this.data.url);
			this.attributes.loaded = false;
			if(this.initialized) altspace.updateNativeComponent(this.component, this.type, this.data);
		},
		callComponentFunc: function(functionName, functionArgs) {
			if(altspace.inClient) {
				return altspace.callNativeComponentFunc(this.component, this.type, functionName, functionArgs).then(function(data) {
					if(functionName === 'GetBoundingBox') return new THREE.Box3(new THREE.Vector3().subVectors(data.center, data.extents), new THREE.Vector3().addVectors(data.center, data.extents));
					return data;
				});
			} else {
				if(this.shimbehavior && functionName === 'GetBoundingBox') return this.shimbehavior.getBoundingBox();
			}

			return Promise.resolve();
		},
		shimUpdate: function() {
			if(!altspace.inClient && this.shimbehavior) {
				this.data.url = altspaceutil.getAbsoluteURL(this.data.url);
				if(this.shimbehavior.config.url !== this.data.url || this.shimbehavior.config.sceneIndex !== this.data.sceneIndex) {
					this.attributes.loaded = false;
					this.shimbehavior.config.url = this.data.url;
					this.shimbehavior.config.sceneIndex = this.data.sceneIndex;
				}
			}
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
		} else {
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
			}

			if(this.defaults && this.defaults.shimUpdate) this.defaults.shimUpdate.bind(this)();
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
		if(this.shimbehavior && this.object3d) this.object3d.removeBehavior(this.shimbehavior);

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

		if(this.initialized) {
			if(this.defaults && this.defaults.dispose) this.defaults.dispose.bind(this)();
			altspace.removeNativeComponent(this.component, this.type);
		}

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
		this.shimbehavior = null;
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
