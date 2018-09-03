/**
 * The GLTF behavior loads and displays a glTF model asset.
 *
 * @class GLTF
 * @param {Object} [config] Optional parameters.
 * @param {String} [config.url] A URL to the GLTF model file to be loaded.
 * @param {Number} [config.sceneIndex=0] Specifies the scene to load when the GLTF model contains multiple scenes.
 * @param {Boolean} [config.native=true] Specifies whether a native glTF (n-gltf) component will be used when running the app in the Altspace client.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.GLTF = class {
	get type() { return 'GLTF'; }

	constructor(config) {
		this.config = Object.assign({ url: '', sceneIndex: 0, native: true }, config);
		this.config.url = altspaceutil.getAbsoluteURL(this.config.url);
		this.url = this.config.url;
		this.sceneIndex = this.config.sceneIndex;
		this.loading = false;
		this.loaded = false;
	}

	awake(o, s) {
		this.object3d = o;

		altspaceutil.manageBehavior(this, this.object3d);

		if(this.config.native && altspace.inClient) {
			this.nativeComponent = new altspaceutil.behaviors.NativeComponent('n-gltf', { url: this.config.url, sceneIndex: this.config.sceneIndex }, { useCollider: true });
			this.object3d.addEventListener('n-gltf-loaded', () => {
				this.loaded = this.nativeComponent.getAttribute('loaded');
				this.object3d.dispatchEvent({
					type: 'gltf-loaded',
					bubbles: true,
					target: this.object3d
				});
			});
			this.object3d.addBehavior(this.nativeComponent);
		} else {
			this.inverseWorldTransform = new THREE.Matrix4();
			this._loadMesh();
		}
	}

	update() {
		this.config.url = altspaceutil.getAbsoluteURL(this.config.url);

		if(this.config.native && altspace.inClient) {
			this.loaded = this.nativeComponent.getAttribute('loaded');
			this.nativeComponent.data.url = this.config.url;
			this.nativeComponent.data.sceneIndex = this.config.sceneIndex;
		} else {
			if((this.config.url !== this.url || this.config.sceneIndex !== this.sceneIndex) && !this.loading) this._loadMesh();
		}
	}

	getBoundingBox() {
		if(this.config.native && altspace.inClient && this.nativeComponent) return this.nativeComponent.callComponentFunc('GetBoundingBox');
		if(!this.mesh || !this.loaded) return Promise.reject();

		this.object3d.updateMatrixWorld(true);
		this.inverseWorldTransform.getInverse(this.object3d.matrixWorld);
		this.mesh.applyMatrix(this.inverseWorldTransform);

		let bbox = new THREE.Box3().setFromObject(this.mesh);

		this.inverseWorldTransform.getInverse(this.inverseWorldTransform);
		this.mesh.applyMatrix(this.inverseWorldTransform);

		return Promise.resolve(bbox);
	}

	_loadMesh() {
		this.loaded = false;
		if(this.mesh) {
			this.object3d.remove(this.mesh);
			this.mesh = null;
		}
		this.loading = true;
		this.url = this.config.url;
		this.sceneIndex = this.config.sceneIndex;
		altspaceutil.loadAsset(this.url, { native: false, sceneIndex: this.sceneIndex || 0 }).then(asset => {
			if(this.loading && !this.mesh) {
				this.mesh = asset;
				this.object3d.add(this.mesh);
				this.loaded = true;
				this.loading = false;
				this.object3d.dispatchEvent({
					type: 'gltf-loaded',
					bubbles: true,
					target: this.object3d
				});
			}
		});
	}

	dispose() {
		if(this.object3d && this.config.native && altspace.inClient) {
			if(this.nativeComponent) this.object3d.removeBehavior(this.nativeComponent);
		} else {
			this.mesh = null;
			this.loaded = false;
			this.loading = false;
			this.url = null;
			this.sceneIndex = null;
		}
	}

	clone() {
		return new altspaceutil.behaviors.GLTF(this.config);
	}
}
