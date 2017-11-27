/**
 * Changes the color of an object's material when the cursor hovers over it, and restores the original color when the cursor is no longer hovering over the object.
 * 
 * @class HoverMaterialColor
 * @param {Object} [config] Optional parameters.
 * @param {THREE.Material} [config.material] A reference to the material whose color will be updated.  Defaults to material of the object the behavior is attached to.
 * @param {Number} [config.color=new THREE.Color('yellow')] The value that will be applied to the object's material color when the cursor hovers over it.
 * @param {Number} [config.beginDuration=75] Duration the hovered color adjustment effect is intended to take to complete, in milliseconds.
 * @param {Number} [config.endDuration=75] Duration the unhovered color adjustment effect is intended to take to complete, in milliseconds.
 * @param {Boolean} [config.revertOnDispose=true] Specifies whether the object's original material color should be restored when the behavior has been destroyed.
 * @param {Object} [config.eventListener=null] Specifies an optional object that will listen for cursor events.  By default the object that the behavior is attached to will be used as the event listener.
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
