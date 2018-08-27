// Font Loader Helper
altspaceutil._FontGlobals = {
	fontUrl: 'https://rawgit.com/NGenesis/altspacevr-behaviors/master/fonts/Varela_Round/Varela_Round.json',
	textureUrl: 'https://rawgit.com/NGenesis/altspacevr-behaviors/master/fonts/Varela_Round/Varela_Round.png',
	width: 510,
	height: 250,
	scale: 0.001945,
	letterSpacing: 1.9,
	lineHeight: 62,
	tabSize: 9,
	anisotropy: 16,
	alphaTest: 0.0001,
	smoothing: 0.02,
	threshold: 0.5,
	uniforms: {
		map: { type: 't', value: null }
	},
	font: null,
	createShaderUniforms: () => {
		return THREE.UniformsUtils.clone(altspaceutil._FontGlobals.uniforms);
	},
	createVertexShader: () => {
		return `varying vec2 vUv;
		varying vec4 vColor;
		attribute vec4 color;
		void main() {
			vUv = uv;
			vColor = color;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}`;
	},
	createFragmentShader: () => {
		return `varying vec2 vUv;
		varying vec4 vColor;
		uniform sampler2D map;
		void main() {
			float distance = texture2D(map, vUv).a;
			float alpha = smoothstep(` + altspaceutil._FontGlobals.threshold + ` - ` + altspaceutil._FontGlobals.smoothing + `, ` + altspaceutil._FontGlobals.threshold + ` + ` + altspaceutil._FontGlobals.smoothing + `, distance) * vColor.w;
			gl_FragColor = vec4(vColor.xyz, alpha);`
			+ (altspaceutil._FontGlobals.alphaTest ? (`if(gl_FragColor.a < ` + altspaceutil._FontGlobals.alphaTest + `) discard;`) : '') + 
		`}`;
	},
	loadMaterial: () => {
		let texture = new THREE.TextureLoader().load(altspaceutil._FontGlobals.textureUrl, () => {
			texture.needsUpdate = true;
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;
			texture.anisotropy = altspaceutil._FontGlobals.anisotropy;
		});

		let material = new THREE.ShaderMaterial({ uniforms: altspaceutil._FontGlobals.createShaderUniforms(), fragmentShader: altspaceutil._FontGlobals.createFragmentShader(), vertexShader: altspaceutil._FontGlobals.createVertexShader(), side: THREE.DoubleSide, transparent: true });
		material.uniforms.map.value = texture;
		return material;
	},
	loadFont: () => {
		if(altspaceutil._FontGlobals.font) return Promise.resolve(altspaceutil._FontGlobals.font);

		return new Promise((resolve, reject) => {
			fetch(altspaceutil._FontGlobals.fontUrl).then(response => response.json()).then(font => {
				altspaceutil._FontGlobals.font = font;
				resolve(font);
			});
		})
	}
};

/**
 * The Text behavior displays a text string using an SDF font, supporting line breaks, text alignment and inline formatting tags.
 * e.g. `<color=#FFFFFF>The</color> <color="red">quick <#FFFF00>brown <alpha=#33>fox <color=#FFFFFFFF> jumps over the <noparse><alpha=#DD>lazy</noparse> dog.`
 *
 * Supported Tags
 * `<color=...>Text</color>` Changes the color and opacity of text.
 * `<color=#RRGGBB>` `<color=#RGB>` `<color=#RRGGBBAA>` `<color=#RGBA>` `<#RRGGBB>` `<#RGB>` `<#RRGGBBAA>` `<#RGBA>` `<color="name">` (Supported color names are 'black', 'blue', 'green', 'orange', 'purple', 'red', 'yellow', 'white')
 * `<alpha=#AA>` - Changes the opacity of any text that follows.
 * `<noparse>Text</noparse>` - Prevents formatting tags from being parsed.
 *
 * @class Text
 * @param {Object} [config] Optional parameters.
 * @param {String} [config.text] The text to be displayed.
 * @param {Number} [config.fontSize=10] The size of the text.
 * @param {Number} [config.width=10] The width of the text block to display before text wrapping occurs.
 * @param {Number} [config.height=1] The height offset of the text block.
 * @param {String} [config.horizontalAlign='middle'] The horizontal alignment of the text block.
 * @param {String} [config.verticalAlign='middle'] The vertical alignment of the text block.
 * @param {Boolean} [config.native=true] Specifies whether a native text (n-text) component will be used when running the app in the Altspace client.
 * @memberof module:altspaceutil/behaviors
 **/
altspaceutil.behaviors.Text = class {
	get type() { return 'Text'; }

	constructor(config) {
		this.config = Object.assign({ text: '', fontSize: 10, width: 10, height: 1, horizontalAlign: 'middle', verticalAlign: 'middle', native: true }, config);
	}

	awake(o) {
		this.object3d = o;
		this.loading = true;

		altspaceutil.manageBehavior(this, this.object3d);

		if(this.config.native && altspace.inClient) {
			this.nativeComponent = new altspaceutil.behaviors.NativeComponent('n-text', { text: this.config.text, fontSize: this.config.fontSize, width: this.config.width, height: this.config.height, horizontalAlign: this.config.horizontalAlign, verticalAlign: this.config.verticalAlign });
			this.object3d.addBehavior(this.nativeComponent);
		} else {
			Promise.all([altspaceutil._FontGlobals.loadFont(), altspaceutil.loadScript('https://rawgit.com/NGenesis/altspacevr-behaviors/master/lib/three-bmfont-text/three-bmfont-text.min.js', { scriptTest: () => window.createGeometry })]).then(() => {
				if(this.loading) {
					this.loading = false;
					this._updateText(true);
				}
			});
		}
	}

	update() {
		if(this.config.native && altspace.inClient && this.nativeComponent) {
			this.nativeComponent.data.text = this.config.text;
			this.nativeComponent.data.fontSize = this.config.fontSize;
			this.nativeComponent.data.width = this.config.width;
			this.nativeComponent.data.height = this.config.height;
			this.nativeComponent.data.horizontalAlign = this.config.horizontalAlign;
			this.nativeComponent.data.verticalAlign = this.config.verticalAlign;
		} else {
			if(this.mesh && (this.text !== this.config.text || this.fontSize !== this.config.fontSize || this.width !== this.config.width || this.height !== this.config.height || this.horizontalAlign !== this.config.horizontalAlign || this.verticalAlign !== this.config.verticalAlign)) {
				this._updateText();
			}
		}
	}

	dispose() {
		if(this.object3d && this.config.native && altspace.inClient) {
			if(this.nativeComponent) this.object3d.removeBehavior(this.nativeComponent);
		} else {
			if(this.loading) this.loading = false; // Prevent race conditions when font is being loaded
			if(this.mesh && this.mesh.parent) this.mesh.parent.remove(this.mesh);
		}
	}

	clone() {
		return new altspaceutil.behaviors.Text(this.config);
	}

	_updateText(init) {
		this.text = this.config.text;
		this.fontSize = this.config.fontSize;
		this.width = this.config.width;
		this.height = this.config.height;
		this.horizontalAlign = this.config.horizontalAlign;
		this.verticalAlign = this.config.verticalAlign;

		this.bmconfig = this._createFontConfig();

		let parsedText = this._parseText();
		this.bmconfig.text = parsedText.text;

		if(init) {
			this.mesh = new THREE.Mesh(createGeometry(this.bmconfig), altspaceutil._FontGlobals.loadMaterial());
			this.object3d.add(this.mesh);
		} else {
			this.mesh.geometry.update(this.bmconfig);
		}

		this.mesh.geometry.computeBoundingBox();
		this._updateTextStyles(parsedText.styles);
		this._updateTextLayout();
	}

	_parseText() {
		let text = this.config.text;
		let parsedText = '';
		let parsedTag = '';
		let skipTag = false;
		let isParsingTag = false;

		let statestack = [];
		let states = [];
		let currentstate = { color: { r: 1, g: 1, b: 1, a: 1 }, tag: 'color' };
		statestack.push(JSON.parse(JSON.stringify(currentstate))); // Default state should not be removed from stack

		let addState = str => {
			parsedText += str;
			let state = JSON.parse(JSON.stringify(currentstate));
			for(let i = 0; i < str.length; ++i) {
				if(!/\s/.test(str.charAt(i))) states.push(state);
			}
		};

		let pushColorState = tag => {
			let state = JSON.parse(JSON.stringify(currentstate));
			state.tag = tag;
			statestack.push(state);
			return state;
		}

		let popColorState = () => {
			let count = 0;
			while(statestack.length > 1) {
				if(statestack[statestack.length - 1].tag === 'color') {
					if(count++ > 0) break;
				}
				statestack.pop();
			}
			currentstate = JSON.parse(JSON.stringify(statestack[statestack.length - 1]));
		}

		let parseColorHex = str => {
			if(/^#[0-9A-F]{8}$/i.test(str)) {
				currentstate.color.r = parseInt(str.substring(1, 3), 16) / 255.0;
				currentstate.color.g = parseInt(str.substring(3, 5), 16) / 255.0;
				currentstate.color.b = parseInt(str.substring(5, 7), 16) / 255.0;
				currentstate.color.a = parseInt(str.substring(7, 9), 16) / 255.0;
				return true;
			} else if(/^#[0-9A-F]{6}$/i.test(str)) {
				currentstate.color.r = parseInt(str.substring(1, 3), 16) / 255.0;
				currentstate.color.g = parseInt(str.substring(3, 5), 16) / 255.0;
				currentstate.color.b = parseInt(str.substring(5, 7), 16) / 255.0;
				currentstate.color.a = 1;
				return true;
			} else if(/^#[0-9A-F]{4}$/i.test(str)) {
				currentstate.color.r = parseInt(str.charAt(1) + str.charAt(1), 16) / 255.0;
				currentstate.color.g = parseInt(str.charAt(2) + str.charAt(2), 16) / 255.0;
				currentstate.color.b = parseInt(str.charAt(3) + str.charAt(3), 16) / 255.0;
				currentstate.color.a = parseInt(str.charAt(4) + str.charAt(4), 16) / 255.0;
				return true;
			} else if(/^#[0-9A-F]{3}$/i.test(str)) {
				currentstate.color.r = parseInt(str.charAt(1) + str.charAt(1), 16) / 255.0;
				currentstate.color.g = parseInt(str.charAt(2) + str.charAt(2), 16) / 255.0;
				currentstate.color.b = parseInt(str.charAt(3) + str.charAt(3), 16) / 255.0;
				currentstate.color.a = 1;
				return true;
			}

			return false;
		};

		let parseColorName = str => {
			switch(str.substring(1, str.length - 1)) {
				case 'black': {
					currentstate.color.r = currentstate.color.g = currentstate.color.b = 0;
					break;
				}
				case 'blue': {
					currentstate.color.r = currentstate.color.g = 0;
					currentstate.color.b = 1;
					break;
				}
				case 'green': {
					currentstate.color.r = currentstate.color.b = 0;
					currentstate.color.g = 1;
					break;
				}
				case 'orange': {
					currentstate.color.r = 1;
					currentstate.color.g = 0.6039215686;
					currentstate.color.b = 0;
					break;
				}
				case 'purple': {
					currentstate.color.r = currentstate.color.b = 1;
					currentstate.color.g = 0;
					break;
				}
				case 'red': {
					currentstate.color.r = 1;
					currentstate.color.g = currentstate.color.b = 0;
					break;
				}
				case 'yellow': {
					currentstate.color.r = currentstate.color.g = 1;
					currentstate.color.g = 1;
					break;
				}
				case 'white':
				default: {
					currentstate.color.r = currentstate.color.g = currentstate.color.b = 1;
					break;
				}
			}
			return true;
		};

		let parseAlphaHex = str => {
			if(/^#[0-9A-F]{2}$/i.test(str)) {
				currentstate.color.a = parseInt(str.substring(1, 3), 16) / 255.0;
				return true;
			}

			return false;
		};

		for(let i = 0; i < text.length;) {
			let c = text.charAt(i);
			++i;

			if(isParsingTag) {
				// Attempt to parse tag
				if(c === '<') {
					// Previous contents isn't a tag, add it to the parsed text and reset.
					addState(parsedTag);
					parsedTag = c;
				} else if(c === '>') {
					// Reached end of tag, tag type and properties can be parsed
					isParsingTag = false;
					parsedTag += c;

					let isEndTag = parsedTag.charAt(1) === '/';
					let [tagType, tagProperty] = parsedTag.substring(isEndTag ? 2 : 1, parsedTag.length - 1).split('=');
					if(tagType.length > 0) {
						if(tagType === 'noparse') {
							skipTag = !isEndTag;
						} else if(skipTag) {
							// Add unparsed/unsupported tag to parsed text
							addState(parsedTag);
						} else if(tagType.charAt(0) === '#' && !tagProperty && !isEndTag) {
							// Hex color code tag
							if(parseColorHex(tagType)) {
								pushColorState('color');
							} else {
								// Invalid hex color code, add to parsed text
								addState(parsedTag);
							}
						} else if(tagType === 'color') {
							if(isEndTag) {
								// Revert to previous color/alpha state
								popColorState();
							} else {
								// Hex code/Named color tag
								if(tagProperty && ((tagProperty.length > 1 && tagProperty.charAt(0) === '#' && parseColorHex(tagProperty)) || (tagProperty.length > 2 && tagProperty.charAt(0) === '"' && tagProperty.charAt(tagProperty.length - 1) === '"' && parseColorName(tagProperty)))) {
									pushColorState('color');
								} else {
									// Invalid color tag, add to parsed text
									addState(parsedTag);
								}
							}
						} else if(tagType === 'alpha' && !isEndTag) {
							// Hex alpha tag
							if(tagProperty && tagProperty.length > 1 && tagProperty.charAt(0) === '#' && parseAlphaHex(tagProperty)) {
								pushColorState('alpha');
							} else {
								// Invalid alpha tag, add to parsed text
								addState(parsedTag);
							}
						} else {
							// Invalid tag type, add to parsed text
							addState(parsedTag);
						}
					} else {
						// Empty tags are invalid, add to parsed text
						addState(parsedTag);
					}
				} else {
					parsedTag += c;
				}
			} else {
				// Attempt to parse text
				if(c === '<') {
					// Start parsing tag
					isParsingTag = true;
					parsedTag = c;
				} else {
					// Contiue parsing text
					addState(c);
				}
			}
		}

		return { text: parsedText, styles: states };
	}

	_updateTextStyles(styles) {
		let color = new Float32Array(this.mesh.geometry.attributes.position.count * 4);
		for(let i = 0; i < color.length;) {
			let style = styles[Math.floor(i / 16)].color;
			for(let j = 0; j < 4; ++j) {
				color[i++] = style.r;
				color[i++] = style.g;
				color[i++] = style.b;
				color[i++] = style.a;
			}
		}
		this.mesh.geometry.addAttribute('color', new THREE.BufferAttribute(color, 4));
	}

	_updateTextLayout() {
		this.mesh.position.x = -this.mesh.geometry.layout.width / 2;
		this.mesh.position.z = 0;
		switch(this.config.verticalAlign) {
			case 'top': {
				this.mesh.position.y = this.mesh.geometry.boundingBox.min.y + this.bmconfig.height;
				break;
			}

			case 'bottom': {
				this.mesh.position.y = this.mesh.geometry.boundingBox.max.y - this.bmconfig.height;
				break;
			}

			case 'middle':
			default: {
				this.mesh.position.y = (this.mesh.geometry.boundingBox.max.y + this.mesh.geometry.boundingBox.min.y) / 2;
				break;
			}
		}
		this.mesh.position.multiplyScalar(this.bmconfig.scale);
		this.mesh.rotation.x = Math.PI;
		this.mesh.scale.setScalar(this.bmconfig.scale);
	}

	_createFontConfig() {
		return { text: this.config.text, width: altspaceutil._FontGlobals.width * this.config.width * (1 / this.config.fontSize), height: altspaceutil._FontGlobals.height * this.config.height * (1 / this.config.fontSize), align: this.config.horizontalAlign !== 'middle' ? this.config.horizontalAlign : 'center', font: altspaceutil._FontGlobals.font, lineHeight: altspaceutil._FontGlobals.lineHeight, letterSpacing: altspaceutil._FontGlobals.letterSpacing, tabSize: altspaceutil._FontGlobals.tabSize, scale: altspaceutil._FontGlobals.scale * this.config.fontSize, trimWhitespace: false };
	}
}
