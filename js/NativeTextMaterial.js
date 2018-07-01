/**
 * Updates the color and opacity of a n-text native component using a material source.
 * 
 * @class NativeTextMaterial
 * @param {Object} [config] Optional parameters.
 * @param {THREE.Material} [config.material=null] A reference to the material whose properties will be applied to the n-text native component.  Defaults to material of the object the behavior is attached to.
 * @param {Boolean} [config.color=true] Specifies whether the n-text native component should use the color of the source material.
 * @param {Boolean} [config.opacity=true] Specifies whether the n-text native component should use the opacity of the source material.
 * @memberof module:altspace/utilities/behaviors
 */
altspaceutil.behaviors.NativeTextMaterial = function(config) {
	config = config || {};

	this.type = 'NativeTextMaterial';

	this.awake = function(o) {
		this.object3d = o;
		this.component = this.object3d.getBehaviorByType('n-text');
		this.material = config.material || this.object3d.material || new THREE.MeshBasicMaterial({ transparent: true });
		this.hasColor = ((config.color !== undefined) ? config.color : true);
		this.hasOpacity = ((config.opacity !== undefined) ? config.opacity : true);
	}

	this.update = function(deltaTime) {
		this.removeMaterialTags();
		this.component.data.text = this.getMaterialTags() + this.component.data.text;
	}

	this.dispose = function() {
		this.removeMaterialTags();
	}

	this.removeMaterialTags = function() {
		var tagBegin = this.component.data.text.indexOf('<link id="n-text-material">');
		var tagEnd = tagBegin >= 0 ? this.component.data.text.indexOf('</link>', tagBegin) : -1;
		if(tagBegin >= 0 && tagEnd >= 0) this.component.data.text = this.component.data.text.slice(0, tagBegin) + this.component.data.text.slice(tagEnd + 7);
	}

	this.getMaterialTags = function() {
		var tags = '<link id="n-text-material">';
		if(this.hasColor) tags += '<color=#' + this.getColorHexString() + this.getOpacityHexString() + '>';
		else if(this.hasOpacity) tags += '<alpha=#' + this.getOpacityHexString() + '>';
		tags += '</link>';

		return tags;
	}

	this.getColorHexString = function() {
		return this.material.color.getHexString();
	}

	this.getOpacityHexString = function() {
		var hexOpacity = (+Math.floor(this.hasOpacity && this.material.transparent ? this.material.opacity * 255 : 255)).toString(16).toUpperCase();
		if(hexOpacity.length < 2) hexOpacity = '0' + hexOpacity;
		return hexOpacity;
	}
}

/**
 * The n-text-material component updates the color and opacity of a {n-text} native component using a material source.
 *
 * @class n-text-material
 * @param {Selector} [material] A reference to the object whose material properties will be applied to the n-text native component.  Defaults to material of the object the component is attached to.
 * @param {Boolean} [color=true] Specifies whether the n-text native component should use the color of the source material.
 * @param {Boolean} [opacity=true] Specifies whether the n-text native component should use the opacity of the source material.
 * @memberof module:altspaceutil/behaviors
 **/
if(window.AFRAME) {
	if(AFRAME.components['n-text-material']) delete AFRAME.components['n-text-material'];

	AFRAME.registerComponent('n-text-material', {
		dependencies: ['n-text'],
		schema: {
			material: { type: 'selector' },
			color: { type: 'boolean', default: true },
			opacity: { type: 'boolean', default: true }
		},
		init: function() {
			this.component = this.el.getAttribute('n-text');
			this.material = this.data.material ? this.data.material.object3DMap.mesh.material : this.el.object3DMap.mesh.material;
		},
		remove: function() {
			this.removeMaterialTags();
		},
		tick: function(deltaTime) {
			this.removeMaterialTags();
			this.el.setAttribute('n-text', 'text', this.getMaterialTags() + this.component.text);
		},
		removeMaterialTags: function() {
			var tagBegin = this.component.text.indexOf('<link id="n-text-material">');
			var tagEnd = tagBegin >= 0 ? this.component.text.indexOf('</link>', tagBegin) : -1;
			if(tagBegin >= 0 && tagEnd >= 0) this.component.text = this.component.text.slice(0, tagBegin) + this.component.text.slice(tagEnd + 7);
		},
		getMaterialTags: function() {
			var tags = '<link id="n-text-material">';
			if(this.data.color) tags += '<color=#' + this.getColorHexString() + this.getOpacityHexString() + '>';
			else if(this.data.opacity) tags += '<alpha=#' + this.getOpacityHexString() + '>';
			tags += '</link>';

			return tags;
		},
		getColorHexString: function() {
			return this.material.color.getHexString();
		},
		getOpacityHexString: function() {
			var hexOpacity = (+Math.floor(this.data.opacity && this.material.transparent ? this.material.opacity * 255 : 255)).toString(16).toUpperCase();
			if(hexOpacity.length < 2) hexOpacity = '0' + hexOpacity;
			return hexOpacity;
		}
	});
}
