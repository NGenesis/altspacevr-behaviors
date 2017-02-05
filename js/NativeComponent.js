altspace = altspace || {};
altspace.utilities = altspace.utilities || {};
altspace.utilities.behaviors = altspace.utilities.behaviors || {};

altspace.utilities.behaviors.NativeComponent = function(_type, _data) {
	this.type = _type;
	this.data = _data;
	var object3d, placeholder;

	this.awake = function(o) {
		this.component = object3d = o;

		if(!(this.component instanceof THREE.Mesh)) {
			// Create Placeholder Mesh
			this.component = placeholder = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), Object.assign(new THREE.MeshBasicMaterial(), { visible: false }));
			object3d.add(placeholder);
		}

		altspace.addNativeComponent(this.component, this.type);
		altspace.updateNativeComponent(this.component, this.type, this.data);
	}

	this.update = function() {
		if(placeholder) {
			// Placeholder Inherits Parent Object Properties
			if(object3d.userData.altspace !== undefined) placeholder.userData.altspace = object3d.userData.altspace;
			placeholder.visible = object3d.visible;
		}

		altspace.updateNativeComponent(this.component, this.type, this.data);
	}

	this.call = function(functionName, functionArgs) {
		altspace.callNativeComponent(this.component, this.type, functionName, functionArgs);
	}

	this.destroy = function() {
		altspace.removeNativeComponent(this.component, this.type);
		if(placeholder) object3d.remove(placeholder);
	}
}