/**
 * The TransformControls behavior enables an object's position, rotation and scale to be manipulated
 * in AltspaceVR with a draggable transform gizmo.
 *
 * @class TransformControls
 * @param {Object} [config] Optional parameters.
 * @param {String} [config.controlType=none] The default control type to be selected.  Supported control types are 'none', 'position', 'rotate' or 'scale'.
 * @param {Boolean} [config.showButtons=false] Specifies whether buttons should be displayed to toggle between control types.
 * @param {Boolean} [config.followTarget=true] Specified whether the transform gizmo should follow the object that is being manipulated.
 * @param {THREE.Object3D} [config.target=null] The target that the transform gizmo should manipulate when interacted with.  If omitted, the object that the 
 * behavior is associated with will be used as the target.
 * @param {Number} [config.scale=1] Adjusts the scale of the transform gizmo.
 * @param {Boolean} [config.allowNegativeScale=false] Specifies whether the scale transform gizmo will allow the target's scale to be negative.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.TransformControls = function(_config) {
	this.type = 'TransformControls';
	this.config = Object.assign({ controlType: 'none', showButtons: false, followTarget: true, target: null, scale: 1, allowNegativeScale: false }, _config);

	this.awake = function(o, s) {
		this.object3d = o;
		this.scene = s;
		this.target = this.config.target || this.object3d;

		if(!altspaceutil.behaviors.TransformControls.Materials) {
			altspaceutil.behaviors.TransformControls.Materials = {
				'red': new THREE.MeshBasicMaterial({ color: 0xFF0000 }),
				'green': new THREE.MeshBasicMaterial({ color: 0x00FF00 }),
				'blue': new THREE.MeshBasicMaterial({ color: 0x0000FF }),
				'yellow': new THREE.MeshBasicMaterial({ color: 0xFFFF00 }),
				'orange': new THREE.MeshBasicMaterial({ color: 0xFFCC00 }),
				'hidden': new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false }),
				'red-transclucent': new THREE.MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.2 }),
				'green-transclucent': new THREE.MeshBasicMaterial({ color: 0x00FF00, transparent: true, opacity: 0.2 }),
				'blue-transclucent': new THREE.MeshBasicMaterial({ color: 0x0000FF, transparent: true, opacity: 0.2 })
			};
		}

		if(!altspaceutil.behaviors.TransformControls.Geometries) {
			altspaceutil.behaviors.TransformControls.Geometries = {
				'button': new THREE.BoxBufferGeometry(0.2, 0.2, 0.2),
				'intersector': new THREE.PlaneBufferGeometry(100000, 100000)
			};
		}

		altspaceutil.manageBehavior(this, this.object3d);

		this.objectState = {};
		this.controls = { none: null, position: new THREE.Group(), rotate: new THREE.Group(), scale: new THREE.Group() };
		this.selectedControlType = this.config.controlType;
		this.selectedControl = null;
		this.controlTypeButtons = null;

		this.scene.addEventListener('cursormove', (function(event) {
			if(!this.selectedControl) {
				if(this.hoveredAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(child.userData.material) {
							child.material = child.userData.material;
							delete child.userData.material;
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
					this.hoveredAxis = null;
				}
				return;
			}

			this.raycaster.set(event.ray.origin, event.ray.direction);
			var intersection = this.raycaster.intersectObject(this.selectedControl, true)[0];

			// Remove Previous Hover Effects
			if(this.hoveredAxis && (!intersection || this.hoveredAxis !== intersection.object)) {
				if(!this.dragAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(child.userData.material) {
							child.material = child.userData.material;
							delete child.userData.material;
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}
				this.hoveredAxis = null;
			}

			if(intersection) {
				this.hoveredAxis = intersection.object;
				if(!this.dragAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(!child.userData.material && child.material.visible) {
							child.userData.material = child.material;
							child.material = altspaceutil.behaviors.TransformControls.Materials['orange'];
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}
			}
		}).bind(this));

		var createAxisOrigin = (function(name, color, size) {
			return Object.assign(new THREE.Mesh(new THREE.BoxBufferGeometry(size.width, size.height, size.depth), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
		}).bind(this);

		var createPositionAxis = (function(name, color, size, position, rotation) {
			if(altspaceutil.behaviors.TransformControls.Geometries['axis-position-' + name]) {
				var axis = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['axis-position-' + name].clone(), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
				axis.position.set(position.x, position.y, position.z);
				axis.rotation.set(rotation.x, rotation.y, rotation.z);

				return axis;
			}

			var axis = Object.assign(new THREE.Mesh(new THREE.BoxGeometry(size.width, size.height, size.depth), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
			axis.position.set(position.x, position.y, position.z);
			axis.rotation.set(rotation.x, rotation.y, rotation.z);

			var axisEnd = new THREE.Object3D();
			axisEnd.position.set(size.width / 2, 0, 0);
			axisEnd.rotation.set(0, 0, -Math.PI / 2);
			axisEnd.updateMatrix();

			var axisEndGeometry = new THREE.CylinderGeometry(0, size.depth * 2, size.depth * 4, 4, 1, false, Math.PI / 4);
			axisEndGeometry.applyMatrix(axisEnd.matrix);

			axis.geometry.merge(axisEndGeometry);
			axis.geometry = new THREE.BufferGeometry().fromGeometry(axis.geometry);

			altspaceutil.behaviors.TransformControls.Geometries['axis-position-' + name] = axis.geometry;

			return axis;
		}).bind(this);

		var createRotateAxis = (function(name, color, size, rotation) {
			if(!altspaceutil.behaviors.TransformControls.Geometries['axis-rotate-' + name]) altspaceutil.behaviors.TransformControls.Geometries['axis-rotate-' + name] = new THREE.RingBufferGeometry(size.radius * 0.8, size.radius * 1.5, 10, 1);

			var axis = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['axis-rotate-' + name], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: name });
			axis.rotation.set(rotation.x, rotation.y, rotation.z);
			var axisGizmo = Object.assign(new THREE.Mesh(new THREE.TorusBufferGeometry(size.radius, size.tube, size.radialSegments, size.tubularSegments), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
			axis.add(axisGizmo);
			return axis;
		}).bind(this);

		var createScaleAxis = (function(name, color, size, position, rotation) {
			if(altspaceutil.behaviors.TransformControls.Geometries['axis-scale-' + name]) {
				var axis = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['axis-scale-' + name].clone(), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
				axis.position.set(position.x, position.y, position.z);
				axis.rotation.set(rotation.x, rotation.y, rotation.z);

				return axis;
			}

			var axis = Object.assign(new THREE.Mesh(new THREE.BoxGeometry(size.width, size.height, size.depth), altspaceutil.behaviors.TransformControls.Materials[color]), { name: name });
			axis.position.set(position.x, position.y, position.z);
			axis.rotation.set(rotation.x, rotation.y, rotation.z);

			var axisEnd = new THREE.Object3D();
			axisEnd.position.set(size.width / 2, 0, 0);
			axisEnd.rotation.set(0, 0, -Math.PI / 2);
			axisEnd.updateMatrix();

			var axisEndGeometry = new THREE.BoxGeometry(size.depth * 2, size.depth * 2, size.depth * 2);
			axisEndGeometry.applyMatrix(axisEnd.matrix);

			axis.geometry.merge(axisEndGeometry);
			axis.geometry = new THREE.BufferGeometry().fromGeometry(axis.geometry);

			altspaceutil.behaviors.TransformControls.Geometries['axis-scale-' + name] = axis.geometry;

			return axis;
		}).bind(this);

		// Position
		this.controls.position.name = 'position';
		this.controls.position.add(
			createAxisOrigin('xyz', 'yellow', { width: 0.15, height: 0.15, depth: 0.15 }).add(
				createPositionAxis('x', 'red', { width: 1, height: 0.05, depth: 0.05 }, { x: 0.5, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }),
				createPositionAxis('y', 'green', { width: 1, height: 0.05, depth: 0.05 }, { x:0, y: 0.5, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }),
				createPositionAxis('z', 'blue', { width: 1, height: 0.05, depth: 0.05 }, { x: 0, y: 0, z: 0.5 }, { x: Math.PI / 2, y: 0, z: Math.PI / 2 })
			)
		);

		// Rotate
		this.controls.rotate.name = 'rotate';
		this.controls.rotate.add(
			createAxisOrigin('xyz', 'yellow', { width: 0.05, height: 0.05, depth: 0.05 }).add(
				createRotateAxis('x', 'red', { radius: 0.7, tube: 0.03, radialSegments: 8, tubularSegments: 28 }, { x: 0, y: Math.PI / 2, z: 0 }),
				createRotateAxis('y', 'green', { radius: 0.7, tube: 0.03, radialSegments: 8, tubularSegments: 28 }, { x: Math.PI / 2, y: 0, z: 0 }),
				createRotateAxis('z', 'blue',{ radius: 0.7, tube: 0.03, radialSegments: 8, tubularSegments: 28 }, { x: 0, y: 0, z: 0 })
			)
		);

		// Scale
		this.controls.scale.name = 'scale';
		this.controls.scale.add(
			createAxisOrigin('xyz', 'yellow', { width: 0.15, height: 0.15, depth: 0.15 }).add(
				createScaleAxis('x', 'red', { width: 1, height: 0.05, depth: 0.05 }, { x: 0.5, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }),
				createScaleAxis('y', 'green', { width: 1, height: 0.05, depth: 0.05 }, { x:0, y: 0.5, z: 0 }, { x: 0, y: 0, z: Math.PI / 2 }),
				createScaleAxis('z', 'blue', { width: 1, height: 0.05, depth: 0.05 }, { x: 0, y: 0, z: 0.5 }, { x: Math.PI / 2, y: 0, z: Math.PI / 2 })
			)
		);

		// Drag Events
		this.onDragBegin = (function(event) {
			this.dragAxis = null;

			if(!this.selectedControl) return;

			this.raycaster.set(event.ray.origin, event.ray.direction);
			var intersection = this.raycaster.intersectObject(this.selectedControl, true)[0];
			if(!intersection) return;

			this.dragAxis = intersection.object.name;

			// Remove Previous Hover Effects
			if(this.hoveredAxis) {
				this.hoveredAxis.traverse((function(child) {
					if(child.userData.material) {
						child.material = child.userData.material;
						delete child.userData.material;
						child.geometry.uvsNeedUpdate = true;
					}
				}).bind(this));
			}

			// Apply Dragged Hover Effect
			var dragHoverAxis = this.selectedControl.getObjectByName(this.dragAxis);
			if(dragHoverAxis) {
				dragHoverAxis.traverse((function(child) {
					if(!child.userData.material && child.material.visible) {
						child.userData.material = child.material;
						child.material = altspaceutil.behaviors.TransformControls.Materials['orange'];
						child.geometry.uvsNeedUpdate = true;
					}
				}).bind(this));
			}

			this.scene.updateMatrixWorld();
			this.dragPointBegin = intersection.point.clone();

			this.controlbase.removeEventListener('cursordown', this.onDragBegin);
			this.scene.addEventListener('cursorup', this.onDragEnd);
			this.scene.addEventListener('cursormove', this.onDragMove);

			this.intersector.quaternion.copy(this.selectedControl.getObjectByName(this.dragAxis).quaternion);

			if(this.dragAxis === 'xyz') {
				this.originIntersectors.traverse(function(child) {
					if(child instanceof THREE.Mesh) child.visible = true;
				});

				intersection = this.raycaster.intersectObjects([this.originIntersectors.children[0], this.originIntersectors.children[1], this.originIntersectors.children[2]], true)[0];
				this.originIntersector = (intersection && intersection.object) ? intersection.object : this.intersector;
				if(intersection) this.dragPointBegin = intersection.point.clone();

				this.originIntersectors.traverse(function(child) {
					if(child instanceof THREE.Mesh) child.visible = false;
				});
			}

			this.dispatchDragBeginEvent();
		}).bind(this);

		this.onDragMove = (function(event) {
			if(!this.selectedControl) {
				this.scene.removeEventListener('cursorup', this.onDragEnd);
				this.scene.removeEventListener('cursormove', this.onDragMove);
				this.controlbase.addEventListener('cursordown', this.onDragBegin);
				this.dragAxis = null;
				return;
			}

			var intersection;
			this.raycaster.set(event.ray.origin, event.ray.direction);

			if(this.dragAxis === 'xyz') {
				this.originIntersector.visible = true;
				intersection = this.raycaster.intersectObject(this.originIntersector, true)[0];
				this.originIntersector.visible = false;
			} else {
				this.intersector.quaternion.copy(this.selectedControl.getObjectByName(this.dragAxis).quaternion);
				this.intersector.visible = true;
				intersection = this.raycaster.intersectObject(this.intersector, true)[0];
				this.intersector.visible = false;
			}

			if(!intersection) return;

			var lastRotateDragDelta = this.dragPointBegin.clone().sub(this.object3d.position);
			var rotateDragDelta = intersection.point.clone().sub(this.object3d.position);
			var dragDelta = intersection.point.clone().sub(this.dragPointBegin);
			this.dragPointBegin = intersection.point.clone();
			var eventDragDelta = new THREE.Vector3();

			if(this.selectedControlType === 'position') {
				switch(this.dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						eventDragDelta[this.dragAxis] += dragDelta[this.dragAxis];
						break;
					}
					case 'xyz': {
						if(this.originIntersector.name === 'x') {
							eventDragDelta.set(dragDelta.x, dragDelta.y, 0);
						} else if(this.originIntersector.name === 'y') {
							eventDragDelta.set(0, dragDelta.y, dragDelta.z);
						} else if(this.originIntersector.name === 'z') {
							eventDragDelta.set(dragDelta.x, 0, dragDelta.z);
						} else eventDragDelta.copy(dragDelta);
						break;
					}
				}

				this.target.position.add(eventDragDelta);
			} else if(this.selectedControlType === 'scale') {
				switch(this.dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						eventDragDelta[this.dragAxis] += dragDelta[this.dragAxis];
						this.target.scale.add(eventDragDelta);

						if(this.target.scale[this.dragAxis] === undefined || isNaN(this.target.scale[this.dragAxis]) || (!this.config.allowNegativeScale && this.target.scale[this.dragAxis] < 0)) this.target.scale[this.dragAxis] = Number.EPSILON;
						break;
					}
					default: {
						var maxScaleFactor = dragDelta.x;
						if(Math.abs(dragDelta.y) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.y;
						if(Math.abs(dragDelta.z) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.z;

						eventDragDelta.setScalar(maxScaleFactor);
						this.target.scale.add(eventDragDelta);

						if(this.target.scale.x === undefined || isNaN(this.target.scale.x) || (!this.config.allowNegativeScale && this.target.scale.x < 0)) this.target.scale.x = Number.EPSILON;
						if(this.target.scale.y === undefined || isNaN(this.target.scale.y) || (!this.config.allowNegativeScale && this.target.scale.y < 0)) this.target.scale.y = Number.EPSILON;
						if(this.target.scale.z === undefined || isNaN(this.target.scale.z) || (!this.config.allowNegativeScale && this.target.scale.z < 0)) this.target.scale.z = Number.EPSILON;
						break;
					}
				}
			} else if(this.selectedControlType === 'rotate') {
				switch(this.dragAxis) {
					case 'x': {
						var deltaRotation = Math.atan2(rotateDragDelta.z, rotateDragDelta.y) - Math.atan2(lastRotateDragDelta.z, lastRotateDragDelta.y);
						eventDragDelta[this.dragAxis] += deltaRotation;
						break;
					}
					case 'y': {
						var deltaRotation = Math.atan2(rotateDragDelta.x, rotateDragDelta.z) - Math.atan2(lastRotateDragDelta.x, lastRotateDragDelta.z);
						eventDragDelta[this.dragAxis] += deltaRotation;
						break;
					}
					case 'z': {
						var deltaRotation = Math.atan2(rotateDragDelta.y, rotateDragDelta.x) - Math.atan2(lastRotateDragDelta.y, lastRotateDragDelta.x);
						eventDragDelta[this.dragAxis] += deltaRotation;
						break;
					}
				}

				this.target.rotation[this.dragAxis] += eventDragDelta[this.dragAxis];
			}

			this.updateTransform();
			this.dispatchDragMoveEvent(eventDragDelta);
		}).bind(this);

		this.onDragEnd = (function(event) {
			this.scene.removeEventListener('cursorup', this.onDragEnd);
			this.scene.removeEventListener('cursormove', this.onDragMove);
			this.controlbase.addEventListener('cursordown', this.onDragBegin);

			var dragAxis = this.dragAxis;
			this.dragAxis = null;

			if(this.selectedControl && dragAxis) {
				// Remove Dragged Hover Effect
				var dragHoverAxis = this.selectedControl.getObjectByName(dragAxis);
				if(dragHoverAxis) {
					dragHoverAxis.traverse((function(child) {
						if(child.userData.material) {
							child.material = child.userData.material;
							delete child.userData.material;
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}

				// Apply Previous Hover Effect
				if(this.hoveredAxis) {
					this.hoveredAxis.traverse((function(child) {
						if(!child.userData.material && child.material.visible) {
							child.userData.material = child.material;
							child.material = altspaceutil.behaviors.TransformControls.Materials['orange'];
							child.geometry.uvsNeedUpdate = true;
						}
					}).bind(this));
				}
			}

			if(!this.selectedControl) return;

			var intersection;
			this.raycaster.set(event.ray.origin, event.ray.direction);

			if(dragAxis === 'xyz') {
				this.originIntersector.visible = true;
				intersection = this.raycaster.intersectObject(this.originIntersector, true)[0];
				this.originIntersector.visible = false;
			} else {
				this.intersector.quaternion.copy(this.selectedControl.getObjectByName(dragAxis).quaternion);
				this.intersector.visible = true;
				intersection = this.raycaster.intersectObject(this.intersector, true)[0];
				this.intersector.visible = false;
			}

			if(!intersection) return;

			var lastRotateDragDelta = this.dragPointBegin.clone().sub(this.object3d.position);
			var rotateDragDelta = intersection.point.clone().sub(this.object3d.position);
			var dragDelta = intersection.point.clone().sub(this.dragPointBegin);
			this.dragPointBegin = intersection.point.clone();
			var eventDragDelta = new THREE.Vector3();

			if(this.selectedControlType === 'position') {
				switch(dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						eventDragDelta[dragAxis] += dragDelta[dragAxis];
						break;
					}
					case 'xyz': {
						if(this.originIntersector.name === 'x') {
							eventDragDelta.set(dragDelta.x, dragDelta.y, 0);
						} else if(this.originIntersector.name === 'y') {
							eventDragDelta.set(0, dragDelta.y, dragDelta.z);
						} else if(this.originIntersector.name === 'z') {
							eventDragDelta.set(dragDelta.x, 0, dragDelta.z);
						} else eventDragDelta.copy(dragDelta);
						break;
					}
				}

				this.target.position.add(eventDragDelta);
			} else if(this.selectedControlType === 'scale') {
				switch(dragAxis) {
					case 'x':
					case 'y':
					case 'z': {
						eventDragDelta[dragAxis] += dragDelta[dragAxis];
						this.target.scale.add(eventDragDelta);

						if(this.target.scale[dragAxis] === undefined || isNaN(this.target.scale[dragAxis]) || (!this.config.allowNegativeScale && this.target.scale[dragAxis] < 0)) this.target.scale[dragAxis] = Number.EPSILON;
						break;
					}
					default: {
						var maxScaleFactor = dragDelta.x;
						if(Math.abs(dragDelta.y) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.y;
						if(Math.abs(dragDelta.z) > Math.abs(maxScaleFactor)) maxScaleFactor = dragDelta.z;

						eventDragDelta.setScalar(maxScaleFactor);
						this.target.scale.add(eventDragDelta);

						if(this.target.scale.x === undefined || isNaN(this.target.scale.x) || (!this.config.allowNegativeScale && this.target.scale.x < 0)) this.target.scale.x = Number.EPSILON;
						if(this.target.scale.y === undefined || isNaN(this.target.scale.y) || (!this.config.allowNegativeScale && this.target.scale.y < 0)) this.target.scale.y = Number.EPSILON;
						if(this.target.scale.z === undefined || isNaN(this.target.scale.z) || (!this.config.allowNegativeScale && this.target.scale.z < 0)) this.target.scale.z = Number.EPSILON;
						break;
					}
				}
			} else if(this.selectedControlType === 'rotate') {
				switch(dragAxis) {
					case 'x': {
						var deltaRotation = Math.atan2(rotateDragDelta.z, rotateDragDelta.y) - Math.atan2(lastRotateDragDelta.z, lastRotateDragDelta.y);
						eventDragDelta[dragAxis] += deltaRotation;
						break;
					}
					case 'y': {
						var deltaRotation = Math.atan2(rotateDragDelta.x, rotateDragDelta.z) - Math.atan2(lastRotateDragDelta.x, lastRotateDragDelta.z);
						eventDragDelta[dragAxis] += deltaRotation;
						break;
					}
					case 'z': {
						var deltaRotation = Math.atan2(rotateDragDelta.y, rotateDragDelta.x) - Math.atan2(lastRotateDragDelta.y, lastRotateDragDelta.x);
						eventDragDelta[dragAxis] += deltaRotation;
						break;
					}
				}

				this.target.rotation[dragAxis] += eventDragDelta[dragAxis];
			}

			this.updateTransform();
			this.dispatchDragMoveEvent(eventDragDelta);
			this.dispatchDragEndEvent(dragAxis);
		}).bind(this);

		// Control Type Toggle Buttons
		if(this.config.showButtons) {
			var onControlTypeButtonDown = (function(event) {
				this.buttonDownControlType = event.target.name;
			}).bind(this);

			var onControlTypeButtonUp = (function(event) {
				if(event.target.name !== this.buttonDownControlType) return;
				this.setActiveControl(this.buttonDownControlType === this.selectedControlType ? 'none' : this.buttonDownControlType);
			}).bind(this);

			this.controlTypeButtons = new THREE.Group();
			this.controlTypeButtons.position.set(0.5, 1, 0);

			var buttonPosition = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['button'], altspaceutil.behaviors.TransformControls.Materials['red-transclucent']), { name: 'position' });
			var buttonPositionIcon = this.controls.position.clone();
			buttonPositionIcon.position.set(-0.025, -0.025, -0.025);
			buttonPositionIcon.scale.multiplyScalar(0.1);
			buttonPosition.add(buttonPositionIcon);
			buttonPosition.addEventListener('cursordown', onControlTypeButtonDown);
			buttonPosition.addEventListener('cursorup', onControlTypeButtonUp);

			var buttonRotate = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['button'], altspaceutil.behaviors.TransformControls.Materials['green-transclucent']), { name: 'rotate' });
			var buttonRotateIcon = this.controls.rotate.clone();
			buttonRotateIcon.scale.multiplyScalar(0.1);
			buttonRotate.add(buttonRotateIcon);
			buttonRotate.position.set(0.25, 0, 0);
			buttonRotate.addEventListener('cursordown', onControlTypeButtonDown);
			buttonRotate.addEventListener('cursorup', onControlTypeButtonUp);

			var buttonScale = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['button'], altspaceutil.behaviors.TransformControls.Materials['blue-transclucent']), { name: 'scale' });
			var buttonScaleIcon = this.controls.scale.clone();
			buttonScaleIcon.position.set(-0.025, -0.025, -0.025);
			buttonScaleIcon.scale.multiplyScalar(0.1);
			buttonScale.add(buttonScaleIcon);
			buttonScale.position.set(0.5, 0, 0);
			buttonScale.addEventListener('cursordown', onControlTypeButtonDown);
			buttonScale.addEventListener('cursorup', onControlTypeButtonUp);

			this.controlTypeButtons.add(buttonPosition, buttonRotate, buttonScale);
		}

		// Raycaster & Intersection Plane For Drag Hit Testing
		this.raycaster = new THREE.Raycaster();

		this.intersector = Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { visible: false });

		this.originIntersectors = new THREE.Group();
		this.originIntersectors.add(
			Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: 'x', visible: false }),
			Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: 'y', visible: false }),
			Object.assign(new THREE.Mesh(altspaceutil.behaviors.TransformControls.Geometries['intersector'], altspaceutil.behaviors.TransformControls.Materials['hidden']), { name: 'z', visible: false })
		);
		this.originIntersectors.children[1].rotation.y = Math.PI / 2;
		this.originIntersectors.children[2].rotation.x = Math.PI / 2;

		// Group Transform Control Components Together
		this.controlbase = new THREE.Group();
		this.controlbase.add(this.controls.position, this.controls.rotate, this.controls.scale, this.intersector, this.originIntersectors);
		this.controlbase.traverse(function(child) {
			child.userData.isTransformControl = true;
			child.visible = false;
		});
		this.controlbase.addEventListener('cursordown', this.onDragBegin);
		this.scene.add(this.controlbase);
		this.controlbase.scale.setScalar(this.config.scale);
		if(this.controlTypeButtons) this.controlbase.add(this.controlTypeButtons);

		this.setActiveControl(this.selectedControlType);
	}

	this.dispatchDragMoveEvent = function(dragDelta) {
		if(dragDelta.x === 0 && dragDelta.y === 0 && dragDelta.z === 0) return;

		/**
		* Fires an event when the transform gizmo is being dragged.
		*
		* @event transform-controls-dragmove
		* @property {TransformControls} behavior The behavior that controls the transform gizmo.
		* @property {THREE.Object3D} parent The object that the transform gizmo is parented to.
		* @property {THREE.Object3D} transformTarget The object that the transform gizmo will manipulate.
		* @property {String} transformType - The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'.
		* @property {String} transformAxis - The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes).
		* @property {THREE.Vector3} transformDelta - The transform delta that was applied to the target object.
		* @memberof module:altspaceutil/behaviors.TransformControls
		*/
		var self = this;
		this.object3d.dispatchEvent({
			type: 'transform-controls-dragmove',
			detail: {
				behavior: self,
				parent: self.object3d,
				transformTarget: self.target,
				transformType: self.selectedControlType,
				transformAxis: self.dragAxis,
				transformDelta: dragDelta
			},
			bubbles: true,
			target: self.object3d
		});
	}

	this.dispatchDragBeginEvent = function() {
		/**
		* Fires an event when the transform gizmo starts being dragged.
		*
		* @event transform-controls-dragbegin
		* @property {TransformControls} behavior The behavior that controls the transform gizmo.
		* @property {THREE.Object3D} parent The object that the transform gizmo is parented to.
		* @property {THREE.Object3D} transformTarget The object that the transform gizmo will manipulate.
		* @property {String} transformType - The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'.
		* @property {String} transformAxis - The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes).
		* @memberof module:altspaceutil/behaviors.TransformControls
		*/
		var self = this;
		this.object3d.dispatchEvent({
			type: 'transform-controls-dragbegin',
			detail: {
				behavior: self,
				parent: self.object3d,
				transformTarget: self.target,
				transformType: self.selectedControlType,
				transformAxis: self.dragAxis
			},
			bubbles: true,
			target: self.object3d
		});
	}

	this.dispatchDragEndEvent = function(dragAxis) {
		var self = this;
		/**
		* Fires an event when the transform gizmo is no longer being dragged.
		*
		* @event transform-controls-dragend
		* @property {TransformControls} behavior The behavior that controls the transform gizmo.
		* @property {THREE.Object3D} parent The object that the transform gizmo is parented to.
		* @property {THREE.Object3D} transformTarget The object that the transform gizmo will manipulate.
		* @property {String} transformType - The type of transform being performed.  Possible values are 'position', 'rotate' and 'scale'.
		* @property {String} transformAxis - The axis that the transform is being performed on.  Possible values are 'x', 'y', 'z' (for single axes) and 'xyz' (for all axes).
		* @memberof module:altspaceutil/behaviors.TransformControls
		*/
		this.object3d.dispatchEvent({
			type: 'transform-controls-dragend',
			detail: {
				behavior: self,
				parent: self.object3d,
				transformTarget: self.target,
				transformType: self.selectedControlType,
				transformAxis: dragAxis
			},
			bubbles: true,
			target: self.object3d
		});
	}

	this.updateTransform = function() {
		// Transform Control Follows Object
		this.scene.updateMatrixWorld();
		this.controlbase.position.copy((this.config.followTarget ? this.target : this.object3d).getWorldPosition());
	}

	this.update = function() {
		this.updateTransform();

		// Remove Cursor Colliders
		this.target.traverse((function(child) {
			if(!child.userData.isTransformControl && (!child.userData.altspace || !child.userData.altspace.collider || child.userData.altspace.collider.enabled)) {
				this.objectState[child.uuid] = Object.assign(this.objectState[child.uuid] || {}, { collider: { enabled: true } });
				child.userData.altspace = { collider: { enabled: false } };
			}
		}).bind(this));
	}

	this.dispose = function() {
		this.setActiveControl('none');
		if(this.intersector && this.intersector.parent) this.intersector.parent.remove(this.intersector);
		if(this.controlTypeButtons && this.controlTypeButtons.parent) this.controlTypeButtons.parent.remove(this.controlTypeButtons);

		// Restore Cursor Colliders
		if(this.target) {
			this.target.traverse((function(child) {
				if(!child.userData.isTransformControl && this.objectState[child.uuid]) {
					child.userData.altspace = Object.assign(child.userData.altspace || {}, { collider: this.objectState[child.uuid].collider });
					delete this.objectState[child.uuid];
				}
			}).bind(this));
		}

		this.object3d = null;
		this.target = null;
		this.scene = null;
		this.objectState = null;
		this.controls = null;
		this.selectedControlType = null;
		this.selectedControl = null;
		this.controlbase = null;
		this.controlTypeButtons = null;
		this.buttonDownControlType = null;

		this.intersector = null;
		this.raycaster = null;
		this.originIntersectors = null;
		this.originIntersector = null;

		this.dragPointBegin = null;
		this.dragAxis = null;
		this.hoveredAxis = null;

		this.onDragBegin = null;
		this.onDragEnd = null;
		this.onDragMove = null;
	}

	/**
	* Sets the active control type.
	*
	* @method setActiveControl
	* @param {String} The active control type.  Possible values are 'none', 'position', 'rotate' and 'scale'.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.setActiveControl = function(controlType) {
		if(!this.controls && ['none', 'position', 'rotate', 'scale'].indexOf(controlType) >= 0) {
			this.config.controlType = controlType;
			return;
		}

		if(this.controls && this.object3d && this.target && this.controls.hasOwnProperty(controlType)) {
			if(this.selectedControl) {
				if(controlType === this.selectedControl.name) return;
				this.selectedControl.traverse(function(child) { child.visible = false; });
			} else {
				if(controlType === 'none') return;
			}

			this.selectedControl = this.controls[controlType];
			this.selectedControlType = this.selectedControl ? this.selectedControl.name : 'none';
			if(this.selectedControl) this.selectedControl.traverse(function(child) { child.visible = true; });

			this.update();
		}
	}

	/**
	* Gets the active control type.
	*
	* @method getActiveControl
	* @returns {String} The active control type.  Possible values are 'none', 'position', 'rotate' and 'scale'.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.getActiveControl = function() {
		return this.selectedControlType;
	}

	/**
	* Sets the target object that the transform gizmo will manipulate.
	*
	* @method setTarget
	* @param {THREE.Object3D} The target object that the transform gizmo will manipulate.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.setTarget = function(target) {
		this.target = this.config.target = target;
	}

	/**
	* Gets the target object that the transform gizmo will manipulate.
	*
	* @method getTarget
	* @returns {THREE.Object3D} The target object that the transform gizmo will manipulate.
	* @memberof module:altspaceutil/behaviors.TransformControls
	*/
	this.getTarget = function() {
		return this.target;
	}
}

// A-Frame Wrapper
/**
 * The altspace-transform-controls component enables an object's position, rotation and scale to be manipulated
 * in AltspaceVR with a draggable transform gizmo.
 *
 * @class altspace-transform-controls
 * @param {String} [control-type=none] The default control type to be selected.  Supported control types are 'none', 'position', 'rotate' or 'scale'.
 * @param {Boolean} [show-buttons=false] Specifies whether buttons should be displayed to toggle between control types.
 * @param {Boolean} [follow-target=true] Specified whether the transform gizmo should follow the object that is being manipulated.
 * @param {Selector} [target] The target that the transform gizmo should manipulate when interacted with.  If omitted, the object that the 
 * behavior is associated with will be used as the target.
 * @param {Number} [scale=1] Adjusts the scale of the transform gizmo.
 * @param {Boolean} [allow-negative-scale=false] Specifies whether the scale transform gizmo will allow the target's scale to be negative.
 * @param {Boolean} [sync-events=true] Specifies whether the sync ownership is gained when drag events are fired.  Requires {sync} and {sync-transform} 
 * components be present on the target object.
 * @memberof module:altspaceutil/behaviors
 **/
if(window.AFRAME) {
	AFRAME.registerComponent('altspace-transform-controls', {
		schema: {
			controlType: { type: 'string', default: 'none' },
			showButtons: { type: 'boolean', default: false },
			followTarget: { type: 'boolean', default: true },
			target: { type: 'selector' },
			scale: { type: 'number', default: 1 },
			allowNegativeScale: { type: 'boolean', default: false },
			syncEvents: { type: 'boolean', default: true }
		},
		init: function() {
			this.behavior = new altspaceutil.behaviors.TransformControls({ controlType: this.data.controlType, showButtons: this.data.showButtons, followTarget: this.data.followTarget, target: this.data.target ? this.data.target.object3D : null, scale: this.data.scale, allowNegativeScale: this.data.allowNegativeScale });
			this.el.object3D.addBehavior(this.behavior);

			// Handle Sync System Ownership When Gizmo Is Dragged
			if(this.data.syncEvents) {
				var onDragEvent = (function(event) {
					var target = this.el.object3D.getBehaviorByType('TransformControls').getTarget().el;
					if(target && target.components.sync && target.components.sync.isConnected) {
						target.components.sync.takeOwnership();
						target.setAttribute('position', target.object3D.position);
						target.setAttribute('rotation', { x: THREE.Math.radToDeg(target.object3D.rotation.x), y: THREE.Math.radToDeg(target.object3D.rotation.y), z: THREE.Math.radToDeg(target.object3D.rotation.z) });
						target.setAttribute('scale', target.object3D.scale);
					}
				}).bind(this);

				this.el.object3D.addEventListener('transform-controls-dragbegin', onDragEvent);
				this.el.object3D.addEventListener('transform-controls-dragmove', onDragEvent);
				this.el.object3D.addEventListener('transform-controls-dragend', onDragEvent);
			}
		},
		remove: function() {
			if(this.behavior) this.el.object3D.removeBehavior(this.behavior);
		}
	});
}