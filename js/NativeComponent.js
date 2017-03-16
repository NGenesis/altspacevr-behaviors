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
			recursive: true
		}
	},

	'n-container': {
		data: {
			capacity: 4
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
		}
	},

	'n-skeleton-parent': {
		data: {
			part: 'head',
			side: 'center',
			index: 0,
			//userId: undefined// defaults to current user when omitted
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
	}
};

altspaceutil.behaviors.NativeComponent = function(_type, _data, _config) {
	this.type = _type || 'NativeComponent';

	var defaults = altspaceutil.behaviors.NativeComponentDefaults[this.type];
	this.config = Object.assign({ sendUpdates: true, recursive: false, useCollider: false, updateOnStaleData: true }, (defaults && defaults.config) ? JSON.parse(JSON.stringify(defaults.config)) : {}, _config);
	this.data = Object.assign((defaults && defaults.data) ? JSON.parse(JSON.stringify(defaults.data)) : {}, _data);
	if(defaults && defaults.initComponent) defaults.initComponent.bind(this)();
	if(altspace.inClient && this.config.sendUpdates && this.config.updateOnStaleData) this.oldData = JSON.stringify(this.data);

	this.awake = function(o) {
		this.component = this.object3d = o;

		if(!(this.component instanceof THREE.Mesh)) {
			// Create Placeholder Mesh
			this.component = this.placeholder = new THREE.Mesh(new THREE.BoxBufferGeometry(0.001, 0.001, 0.001), Object.assign(new THREE.MeshBasicMaterial(), { visible: false }));
			this.object3d.add(this.placeholder);
		}

		if(!this.config.useCollider) {
			this.component.userData.altspace = this.component.userData.altspace || {};
			this.component.userData.altspace.collider = this.component.userData.altspace.collider || {};
			this.component.userData.altspace.collider.enabled = false;
		}

		if(altspace.inClient) {
			altspace.addNativeComponent(this.component, this.type);
			if(this.config.sendUpdates) altspace.updateNativeComponent(this.component, this.type, this.data);
		}

		if(this.config.recursive) {
			for(var child of this.object3d.children) {
				child.addBehavior(Object.assign(new altspaceutil.behaviors.NativeComponent(this.type, this.data, this.config), { parent: this }));
			}
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
					this.oldData = newData;
					altspace.updateNativeComponent(this.component, this.type, this.data);
				}
			} else {
				altspace.updateNativeComponent(this.component, this.type, this.data);
			}
		}
	}

	this.callComponent = function(functionName, functionArgs) {
		altspace.callNativeComponent(this.component, this.type, functionName, functionArgs);

		if(this.config.recursive) {
			for(var child of this.object3d.children) {
				var childComponent = child.getBehaviorByType(this.type);
				if(childComponent && childComponent.parent === this) child.callComponent(functionName, functionArgs);
			}
		}
	}

	this.dispose = function() {
		if(this.config.recursive) {
			for(var child of this.object3d.children) {
				var childComponent = child.getBehaviorByType(this.type);
				if(childComponent && childComponent.parent === this) child.removeBehavior(childComponent);
			}
		}

		if(altspace.inClient) altspace.removeNativeComponent(this.component, this.type);
		if(this.placeholder) this.object3d.remove(this.placeholder);
	}
}