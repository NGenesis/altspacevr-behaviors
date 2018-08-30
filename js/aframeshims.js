let makeComponent = (name,schema,callback)=>{
    AFRAME.registerComponent(name,{
        schema:schema,
        init(){
            let defaultPrevented;
            if(callback && typeof callback === "function"){
                defaultPrevented = !!callback(this);
            }
            if(!defaultPrevented){
                this.el.object3d.addBehavior(new altspaceutil.behaviors.NativeComponent(this.attrName,this.data));
            }
        }
    });
};
let forwardEvent = (el,name)=>{
    el.object3d.addEventListener(name, e=>{
        el.emit(name,e);
    });
};
makeComponent('n-object',{
    res: {default:'architecture/wall-4w-4h'}
});
makeComponent('n-spawner',{
    res: {default:'interactables/basketball'}
});
makeComponent('n-text',{
    text: {default:''},
    fontSize: {type:'int',default:10},
    width: {default:10,type:'number'},
    height: {type:'number',default:1},
    horizontalAlign: {default:'middle'},
    verticalAlign: {default:'middle'}
});
makeComponent('n-sphere-collider',{
    isTrigger: {type:'boolean',default:false},
    center: {type:'vec3',default:{ 'x': 0, 'y': 0, 'z': 0 }},
    radius: {default:0,type:'number'},
    type: {default:'environment'}
});
makeComponent('n-box-collider',{
    isTrigger: {type:'boolean',default:false},
    center: {type:'vec3',default:{ 'x': 0, 'y': 0, 'z': 0 }},
    size: {type:'vec3',default:{ 'x': 0, 'y': 0, 'z': 0 }},
    type: {default:'environment'}
});
makeComponent('n-capsule-collider',{
    isTrigger: {type:'boolean',default:false},
    center: {type:'vec3',default:{ 'x': 0, 'y': 0, 'z': 0 }},
    radius: {type:'number',default:0},
    height: {type:'number',default:0},
    direction: {default:'y'},
    type: {default:'environment'}
});
makeComponent('n-mesh-collider',{
    isTrigger: {type:'boolean',default:false},
    convex: {type:'boolean',default:true},
    type: {default:'environment'}
});
makeComponent('n-container',{
    capacity: {type:'int',default:4}
},(context)=>{
    forwardEvent(context.el,'container-count-changed');
    forwardEvent(context.el,'container-empty');
    forwardEvent(context.el,'container-full');
    forwardEvent(context.el,'triggerenter');
    forwardEvent(context.el,'triggerexit');
});
makeComponent('n-sound',{
    on: {default:''},
    res: {default:''},
    src: {default:''},
    loop: {type:'boolean',default:false},
    volume: {type:'number',default:1},
    autoplay: {type:'boolean',default:false},
    oneshot: {type:'boolean',default:false},
    spatialBlend: {type:'number',default:1},
    pitch: {type:'number',default:1},
    minDistance: {type:'number',default:1},
    maxDistance: {type:'number',default:12}
},(context)=>{
    this.el.play = ()=>Promise.resolve();
    this.el.pause = ()=>Promise.resolve();
    forwardEvent(context.el,'n-sound-loaded');
    forwardEvent(context.el,'sound-paused');
    forwardEvent(context.el,'sound-played');
});

makeComponent('n-skeleton-parent',{
    part: {default:'head'},
    side: {default:'center'},
    index: {type:'int',default:0},
    userId: {default:null}
},(context)=>{
    this.el.object3d.addBehavior(new altspaceutil.behaviors.NativeComponent('n-skeleton-parent',context.data,{recursiveMesh:false}));
    return true;
});

makeComponent('n-cockpit-parent',{});

makeComponent('n-billboard',{});

makeComponent('n-animator',{});

makeComponent('n-layout-browser',{
    url: {default:'about:blank'},
    isEnclosure: {type:'boolean',default:false}
});

makeComponent('n-portal',{
    targetEntity: {type:'selector'},
    targetPosition: {type:'vec3',default:{ 'x': 0, 'y': 0, 'z': 0 }},
    targetQuaternion: {type:'vec4',default:{ 'x': 0, 'y': 0, 'z': 0, w: 1 }},
    targetSpace: {default:null},
    targetEvent: {default:null},
},(context)=>{
    if(context.data.targetEl){
        context.data.targetPosition = context.data.targetEl.object3d.position.copy();
        context.data.targetQuaternion = context.data.targetEl.object3d.quaternion.copy();
    }
});

makeComponent('n-gltf',{
    url:{default:''},
    sceneIndex:{type:'int',default:0}
},(context)=>{
    forwardEvent(context.el,'n-gltf-loaded');
    context.el.getBoundingBox = ()=>new THREE.Box3().setFromObject(context.el.object3d);
});
