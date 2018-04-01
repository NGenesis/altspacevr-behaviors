/**
 * The TWEEN behavior provides a convenience wrapper for [tween.js](https://github.com/tweenjs/tween.js/) to manage and update TWEEN and TWEEN.Group objects.
 *
 * @class TWEEN
 * @param {TWEEN.Group} [tweengroup] A tween group to be managed by the behavior.  When ommitted, the global `TWEEN` object will be managed by the behavior.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.TWEEN = function(tweengroup) {
	this.type = 'TWEEN';
	this.group = tweengroup || TWEEN;

	this.update = function(deltaTime) {
		if(this.group) this.group.update();
	}

	this.dispose = function() {
		this.removeAll();
	}

	this.removeAll = function() {
		if(this.group) this.group.removeAll();
	}

	this.getAll = function() {
		return this.group ? this.group.getAll() : null;
	}

	this.add = function(tween) {
		if(this.group) this.group.add(tween);
	}

	this.remove = function(tween) {
		if(this.group) this.group.remove(tween);
	}
}
