'use strict';

window.altspaceutil = window.altspaceutil || {};
altspaceutil.behaviors = altspaceutil.behaviors || {};

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

	'n-collider': {
		data: {
			center: { 'x': 0, 'y': 0, 'z': 0 },
			type: 'environment'
		}
	},

	'n-sphere-collider': {
		data: {
			isTrigger: false,
			center: { 'x': 0, 'y': 0, 'z': 0 },
			radius: 0,
			type: 'environment'
		}
	},

	'n-box-collider': {
		data: {
			isTrigger: false,
			center: { 'x': 0, 'y': 0, 'z': 0 },
			size: { 'x': 0, 'y': 0, 'z': 0 },
			type: 'environment'
		}
	},

	'n-capsule-collider': {
		data: {
			isTrigger: false,
			center: { 'x': 0, 'y': 0, 'z': 0 },
			radius: 0,
			height: 0,
			direction: 'y',
			type: 'environment'
		}
	},

	'n-mesh-collider': {
		data: {
			isTrigger: false,
			convex: true,
			type: 'environment'
		},
		config: {
			recursiveMesh: true
		}
	},

	'n-container': {
		data: {
			capacity: 4
		},
		initComponent: function() {
			var self = this;
			self.count = 0;

			if(altspace.inClient && altspace._internal) {
				// Handle Container Count Changes
				altspace._internal.onClientEvent('NativeContainerCountChanged', function(meshId, count, oldCount) {
					var object3d = altspace._internal.getObject3DById(meshId);
					if(object3d && object3d === self.component) {
						/**
						* The number of objects in the n-container.
						* @instance
						* @member {Number} count
						* @readonly
						* @memberof module:altspace/utilities/behaviors.NativeComponent
						*/
						self.count = count;

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
				});

				// Handle Container State Changes
				altspace._internal.onClientEvent('NativeContainerStateChanged', function(meshId, stateName, didGain) {
					var object3d = altspace._internal.getObject3DById(meshId);
					if(object3d && object3d === self.component) {
						var oldState = self.state;

						self.state = didGain ? stateName : undefined;
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
						if(self.state !== oldState && self.state) {
							object3d.dispatchEvent({
								type: stateName,
								bubbles: true,
								target: object3d
							});
						}
					}
				});

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
			var src = this.data.src;
			if(src && !src.startsWith('http')) {
				if(src.startsWith('/')) {
					this.data.src = location.origin + src;
				} else {
					var currPath = location.pathname;
					if(!currPath.endsWith('/')) currPath = location.pathname.split('/').slice(0, -1).join('/') + '/';
					this.data.src = location.origin + currPath + src;
				}
			}

			if(altspace.inClient && altspace._internal) {
				var self = this;

				// Handle Sound Loaded
				altspace._internal.onClientEvent('NativeSoundLoadedEvent', function(meshId, count, oldCount) {
					var object3d = altspace._internal.getObject3DById(meshId);
					if(object3d && object3d === self.component) {
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
				});
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
			var url = this.data.url;
			if(url && !url.startsWith('http')) {
				if(url.startsWith('/')) {
					this.data.url = location.origin + url;
				} else {
					var currPath = location.pathname;
					if(!currPath.endsWith('/')) currPath = location.pathname.split('/').slice(0, -1).join('/') + '/';
					this.data.url = location.origin + currPath + url;
				}
			}

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
	}
};

altspaceutil.behaviors.NativeComponent = function(_type, _data, _config) {
	this.type = _type || 'NativeComponent';

	this.defaults = altspaceutil.behaviors.NativeComponentDefaults[this.type];
	this.config = Object.assign({ sendUpdates: true, recursiveMesh: false, recursive: false, useCollider: false, updateOnStaleData: true, sharedComponent: true }, (this.defaults && this.defaults.config) ? JSON.parse(JSON.stringify(this.defaults.config)) : {}, _config);
	this.data = Object.assign((this.defaults && this.defaults.data) ? JSON.parse(JSON.stringify(this.defaults.data)) : {}, _data);

	this.awake = function(o, s) {
		this.scene = s;
		this.component = this.object3d = o;

		if(!(this.component instanceof THREE.Mesh)) {
			// Create Placeholder Mesh
			if(this.config.sharedComponent) {
				this.sharedData = this.object3d.userData._sharedNativeComponent = this.object3d.userData._sharedNativeComponent || {};
				this.sharedData.placeholder = this.sharedData.placeholder || new THREE.Mesh(new THREE.BoxBufferGeometry(0.001, 0.001, 0.001), Object.assign(new THREE.MeshBasicMaterial(), { visible: false }));
				this.sharedData.behaviors = this.sharedData.behaviors || [];
				this.sharedData.behaviors.push(this);
				if(!this.sharedData.placeholder.parent) this.object3d.add(this.sharedData.placeholder);
			}

			this.component = this.placeholder = this.sharedData.placeholder || new THREE.Mesh(new THREE.BoxBufferGeometry(0.001, 0.001, 0.001), Object.assign(new THREE.MeshBasicMaterial(), { visible: false }));
			this.object3d.add(this.placeholder);
		}

		if(this.defaults && this.defaults.initComponent) this.defaults.initComponent.bind(this)();

		if(!this.config.useCollider) {
			this.component.userData.altspace = this.component.userData.altspace || {};
			this.component.userData.altspace.collider = this.component.userData.altspace.collider || {};
			this.component.userData.altspace.collider.enabled = false;
		}

		if(altspace.inClient) altspace.addNativeComponent(this.component, this.type);
		this.update();

		// Add Component To Descendants
		if((this.config.recursive || this.config.recursiveMesh) && !this.parent) {
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
		altspace.callNativeComponent(this.component, this.type, functionName, functionArgs);
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