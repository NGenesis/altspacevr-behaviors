'use strict';

window.altspaceutil = window.altspaceutil || {};
altspaceutil.behaviors = altspace.utilities.behaviors || {};

altspaceutil.behaviors.OrbitControls = function() {
	this.type = 'OrbitControls';

	this.awake = function(o) {
		if(!altspace.inClient) this.controls = new THREE.OrbitControls(o);
	}

	this.update = function(deltaTime) {
		if(!altspace.inClient) this.controls.update();
	}
}