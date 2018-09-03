/**
 * The Billboard behavior updates the orientation of an object to face the camera.
 *
 * @class Billboard
 * @param {Object} [config] Optional parameters.
 * @param {THREE.Object3D} [config.target=null] A target that the object should face.  If omitted, the scene camera will be used.
 * @param {Boolean} [config.x=true] Specifies whether the X-axis of the object should be reoriented to face the camera.
 * @param {Boolean} [config.y=true] Specifies whether the Y-axis of the object should be reoriented to face the camera.
 * @param {Boolean} [config.z=true] Specifies whether the Z-axis of the object should be reoriented to face the camera.
 * @param {Boolean} [config.native=true] Specifies whether a native billboard (n-billboard) component will be used when running the app in the Altspace client.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.Billboard = class {
	get type() { return 'Billboard'; }

	set target(target) { this.followTarget = target; }
	get target() { return this.followTarget; }

	constructor(config) {
		this.config = Object.assign({ target: null, x: true, y: true, z: true, native: true }, config);
		this.followTarget = this.config.target;

		this.worldPosition = new THREE.Vector3();
		this.worldPositionTarget = new THREE.Vector3();
		this.lookAtRotation = new THREE.Matrix4();
		this.worldQuaternion = new THREE.Quaternion();
		this.worldUp = new THREE.Vector3();
	}

	awake(o, s) {
		this.object3d = o;
		this.scene = s;

		altspaceutil.manageBehavior(this, this.object3d);

		if(this.config.native && altspace.inClient) {
			this.config.y = false;
			this.nativeComponent = new altspaceutil.behaviors.NativeComponent('n-billboard', {}, { useCollider: true });
			this.object3d.addBehavior(this.nativeComponent);
		}
	}

	update() {
		if(this.config.native && altspace.inClient) return;

		if(!this.followTarget) {
			this.scene.traverseVisible(child => {
				if(!this.followTarget && child.isCamera) {
					this.followTarget = child;
					return;
				}
			});
		}

		if(this.followTarget) {
			// Transform from observer space to world space
			let parent = this.object3d.parent;
			parent.updateMatrixWorld(true);
			this.object3d.applyMatrix(parent.matrixWorld);

			// Move observer to scene temporarily, without firing scene tree events
			//this.scene.add(this.object3d);
			this.object3d.parent.children.splice(this.object3d.parent.children.indexOf(this.object3d), 1);
			this.object3d.parent = this.scene;
			this.object3d.parent.children.push(this.object3d);

			// Limit Axis Rotation
			this.followTarget.getWorldPosition(this.worldPositionTarget);
			this.object3d.getWorldPosition(this.worldPosition);
			if(!this.config.x) this.worldPositionTarget.x = this.worldPosition.x = 0;
			if(!this.config.y) this.worldPositionTarget.y = this.worldPosition.y = 0;
			if(!this.config.z) this.worldPositionTarget.z = this.worldPosition.z = 0;

			// Rotate observer to look at target
			this.lookAtRotation.lookAt(this.worldPositionTarget, this.worldPosition, this.worldUp.copy(this.object3d.up).applyQuaternion(parent.getWorldQuaternion(this.worldQuaternion)).normalize());
			this.object3d.quaternion.setFromRotationMatrix(this.lookAtRotation);
			this.object3d.updateMatrix();

			// Transform from world space to target space
			this.object3d.applyMatrix(this.lookAtRotation.getInverse(parent.matrixWorld));

			// Move observer back to original parent, without firing scene tree events
			//parent.add(this.object3d);
			this.object3d.parent.children.splice(this.object3d.parent.children.indexOf(this.object3d), 1);
			this.object3d.parent = parent;
			this.object3d.parent.children.push(this.object3d);
		}
	}

	dispose() {
		if(this.object3d && this.config.native && altspace.inClient) {
			if(this.nativeComponent) this.object3d.removeBehavior(this.nativeComponent);
		}
	}

	clone() {
		return new altspaceutil.behaviors.Billboard(this.config);
	}
}
