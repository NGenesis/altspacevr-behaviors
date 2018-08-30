let makeComponent = (name,schema)=>{
    AFRAME.registerComponent(name,{
        schema:schema,
        init(){
            return new altspaceutil.behaviors.NativeComponent(this.attrName,this.data);
        }
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
});

makeComponent('n-skeleton-parent',{
    part: {default:'head'},
    side: {default:'center'},
    index: {type:'int',default:0},
    userId: {default:null}
});

makeComponent('n-cockpit-parent',{});

makeComponent('n-billboard',{});

makeComponent('n-animator',{});

makeComponent('n-layout-browser',{
    url: {default:'about:blank'},
    isEnclosure: {type:'boolean',default:false}
});

makeComponent('n-portal',{
    targetPosition: {type:'vec3',default:{ 'x': 0, 'y': 0, 'z': 0 }},
    targetQuaternion: {type:'vec4',default:{ 'x': 0, 'y': 0, 'z': 0, w: 1 }},
    targetSpace: {default:null},
    targetEvent: {default:null},
});

makeComponent('n-gltf',{
    url:{default:''},
    sceneIndex:{type:'int',default:0}
});