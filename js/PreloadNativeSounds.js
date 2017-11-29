/**
 * The PreloadNativeSounds behavior will silently load and play the specified sound
 * files used by n-sound to ensure the resources are cached for subsequent uses.
 * The behavior will remove itself automatically once the sound files have been preloaded.
 *
 * @class PreloadNativeSounds
 * @param {String[]} [sounds] Native sound resources to be preloaded.
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
