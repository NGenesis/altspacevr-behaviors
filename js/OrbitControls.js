var OrbitControlsBehavior = (function() {
	function OrbitControlsBehavior() {
		this.type = 'OrbitControls';

		this.awake = function(o) {
			this.controls = new THREE.OrbitControls(o);
		};

		this.update = function(deltaTime) {
			this.controls.update();
		};
	}

	return OrbitControlsBehavior;
}());

altspace = altspace || {};
altspace.utilities = altspace.utilities || {};
altspace.utilities.behaviors = altspace.utilities.behaviors || {};
altspace.utilities.behaviors.OrbitControls = OrbitControlsBehavior;
