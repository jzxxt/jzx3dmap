/**
 *
 * WebGL With Three.js - Lesson 10 - Drag and Drop Objects
 * http://www.script-tutorials.com/webgl-with-three-js-lesson-10/
 *
 */

sbVertexShader = [
"varying vec3 vWorldPosition;",
"void main() {",
"  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
"  vWorldPosition = worldPosition.xyz;",
"  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
"}",
].join("\n");

sbFragmentShader = [
"uniform vec3 topColor;",
"uniform vec3 bottomColor;",
"uniform float offset;",
"uniform float exponent;",
"varying vec3 vWorldPosition;",
"void main() {",
"  float h = normalize( vWorldPosition + offset ).y;",
"  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( h, exponent ), 0.0 ) ), 1.0 );",
"}",
].join("\n");

var xiangwei_json=[{name:'010101',position:'0_61_0'},{name:'010102',position:'0_183_0'},{name:'010103',position:'0_304_0'},{name:'010111',position:'120_61_0'},{name:'010112',position:'120_183_0'},{name:'010113',position:'120_304_0'}];
var jizhuangxiang_json=[{xiangwei:'010101',name:'TBJU001234'},{xiangwei:'010102',name:'TBJU001288'},{xiangwei:'010103',name:'TBJU008866'}];
var _xiangwei=[];//key:箱位名称,value:箱位所存集装箱代码
var _jizhuangxiang=[];//key:集装箱代码,value:所在箱位名称
var lesson10 = {
  scene: null, camera: null, renderer: null,
  container: null, controls: null, dragAndDropControls:null,
  clock: null, stats: null, droppable:null, tmpDroppable:null,  
  plane: null, selection: null, offset: new THREE.Vector3(), draggables: [], droppables:[], faceMaterial:null,
  raycaster: new THREE.Raycaster(), mouse: new THREE.Vector2(), xiangweiVector:[], originalPosition:[],

  init: function() {

    // Create main scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xcce0ff, 0.0002);

    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;

    // Prepare perspective camera
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 10000;
    this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    this.scene.add(this.camera);
    this.camera.position.set(-1000,850,1200);
    this.camera.lookAt(this.scene.position);

    // Prepare webgl renderer
    this.renderer = new THREE.WebGLRenderer({ antialias:true });
    this.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.renderer.setClearColor(this.scene.fog.color);

    // Prepare container
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    this.container.appendChild(this.renderer.domElement);

    // Events
    THREEx.WindowResize(this.renderer, this.camera);
    //document.addEventListener('mousedown', this.onDocumentMouseDown, false);
    document.addEventListener('mousemove', this.onDocumentMouseMove, false);
    //document.addEventListener('mouseup', this.onDocumentMouseUp, false);

    // Prepare Orbit controls
    this.controls = new THREE.OrbitControls(this.camera);
    this.controls.target = new THREE.Vector3(0, 0, 0);
    this.controls.maxDistance = 1500;

    // Prepare clock
    this.clock = new THREE.Clock();

    // Add lights
    this.scene.add( new THREE.AmbientLight(0x444444));

    var dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(200, 200, 1000).normalize();
    this.camera.add(dirLight);
    this.camera.add(dirLight.target);

    // Display skybox
    //this.addSkybox();

    // Plane, that helps to determinate an intersection position
    this.plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(20000, 20000, 8, 8), new THREE.MeshBasicMaterial({color: 0xaaaaaa}));
    this.plane.visible = false;
    this.scene.add(this.plane);

    // ground
    var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 10000, 10000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false, side: THREE.DoubleSide } ) );
    mesh.rotation.x = - Math.PI / 2;
    this.scene.add( mesh );

    var grid = new THREE.GridHelper( 10000, 20, 0x000000, 0x000000 );
    grid.material.opacity = 0.5;
    grid.material.transparent = true;
    this.scene.add( grid );

    var floorMaterial = new THREE.MeshBasicMaterial( { color: '#aaaaaa', side: THREE.DoubleSide } );
    var floorGeometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -2;
    floor.rotation.x = Math.PI / 2;
    this.scene.add(floor);

    this.addText('sample text','#ff0000');

    var xiangweiBoxGeometry = new THREE.BoxGeometry( 100, 120, 240);
    var boxGeometry = new THREE.BoxGeometry( 100, 120, 240);
    for(i=0;i<xiangwei_json.length;i++){
      var xiangweiBoxMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0.2});
      xiangwei = new THREE.Mesh( xiangweiBoxGeometry, xiangweiBoxMaterial);
      this.xiangweiVector[xiangwei_json[i].name]=xiangwei;
      this.droppables.push(xiangwei);
      var pos=xiangwei_json[i].position.split('_');
      xiangwei.position.x = pos[0]-400;
      xiangwei.position.y = pos[1];
      xiangwei.position.z = pos[2];
      xiangwei.name=xiangwei_json[i].name;
      _xiangwei[xiangwei.name]='';
      this.scene.add( xiangwei ); 
    }

    for(i=0;i<jizhuangxiang_json.length;i++){
      var boxMaterials = this.getBoxMaterial(jizhuangxiang_json[i].name); 
      box = new THREE.Mesh( boxGeometry, boxMaterials);
      this.draggables.push(box);
      //box.position.set(-500+i*110, 61, 0);
      var xiangwei=this.xiangweiVector[jizhuangxiang_json[i].xiangwei];
      box.position.x = xiangwei.position.x;
      box.position.y = xiangwei.position.y;
      box.position.z = xiangwei.position.z;
      box.name=jizhuangxiang_json[i].name;
      _xiangwei[jizhuangxiang_json[i].xiangwei]=jizhuangxiang_json[i].name;
      _jizhuangxiang[jizhuangxiang_json[i].name]=jizhuangxiang_json[i].xiangwei;
      this.scene.add( box ); 
    }

    this.dragAndDropControls = new THREE.DragControls( this.draggables, this.camera, this.renderer.domElement );
    this.dragAndDropControls.addEventListener( 'dragstart', this.dragStartCallback );
    this.dragAndDropControls.addEventListener( 'drag', this.dragCallback );
    this.dragAndDropControls.addEventListener( 'dragend', this.dragendCallback );
  },

  getBoxMaterial: function(text) {
    var boxMaterialArray = [];

    var material=this.genFaceMaterial('#3333ff',this.renderer,text);
    for(k=0;k<6;k++){
      boxMaterialArray.push(material);
    }
    var boxMaterials = new THREE.MeshFaceMaterial( boxMaterialArray );
    return boxMaterials;
  },

  genFaceMaterial: function(color,renderer,text) {
    var dynamicTexture  = new THREEx.DynamicTexture(512,512);
    dynamicTexture.context.font = "bolder 60px Verdana";
    dynamicTexture.texture.anisotropy = renderer.getMaxAnisotropy();
    
    // update the text
    dynamicTexture.clear(color).drawText(text, undefined, 256, 'white');
    var material  = new THREE.MeshBasicMaterial({
      map : dynamicTexture.texture
    });
    return material;
  },

  addSkybox: function() {
    var iSBrsize = 500;
    var uniforms = {
      topColor: {type: "c", value: new THREE.Color(0x0077ff)}, bottomColor: {type: "c", value: new THREE.Color(0xffffff)},
      offset: {type: "f", value: iSBrsize}, exponent: {type: "f", value: 1.5}
    }

    var skyGeo = new THREE.SphereGeometry(iSBrsize, 32, 32);
    skyMat = new THREE.ShaderMaterial({vertexShader: sbVertexShader, fragmentShader: sbFragmentShader, uniforms: uniforms, side: THREE.DoubleSide, fog: false});
    skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(skyMesh);
  },
  onDocumentMouseMove: function (event) {
    //如果没有拖动则不理会
    if(lesson10.selection==null) return;
    event.preventDefault();
    lesson10.mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
    lesson10.raycaster.setFromCamera( lesson10.mouse, lesson10.camera );
    var intersects = lesson10.raycaster.intersectObjects( lesson10.droppables );

    if ( intersects.length > 0 ) {
      var distance=5000;//箱子的最窄边
      var tmpDistance=0;
      //找到距离最近的箱位
      for(i=1;i<intersects.length;i++){
        console.log('box found：'+intersects[i].object.name);
        //TODO:不能只根据距离，如果箱位上有箱子则距离近也不行
        tmpDistance=getDistance(intersects[i].object.position,lesson10.selection.position);
        if(parseInt(tmpDistance)<distance){
          console.log(distance+' '+tmpDistance);
          distance=parseInt(tmpDistance);
          lesson10.tmpDroppable=intersects[i].object;
        }
      }
      if(!lesson10.tmpDroppable || !isDroppable(lesson10.tmpDroppable)){
        if(lesson10.tmpDroppable) console.log('不可放在：'+lesson10.tmpDroppable.name);
        return false;
      } 

      if(lesson10.tmpDroppable) console.log('可放在：'+lesson10.tmpDroppable.name);
      //如果droppable改变了
      if(lesson10.tmpDroppable!=null && lesson10.droppable!==lesson10.tmpDroppable){
        if(lesson10.droppable){
          lesson10.droppable.material.color.setHex( 0xffffff );
          lesson10.droppable.material.opacity=0.1;
        } 
        lesson10.tmpDroppable.material.color.setHex( 0x006600 );
        lesson10.tmpDroppable.material.opacity=0.5;
        lesson10.droppable=lesson10.tmpDroppable;
        lesson10.tmpDroppable=null;
      }
    }
  },
  dragStartCallback: function (event) {
    if(event.object.material.length==6){
      //标记对象为拖动选定对象
      lesson10.selection=event.object;
      //保存对象原始位置，无法放置时返回原位置
      lesson10.originalPosition['x']=event.object.position.x;
      lesson10.originalPosition['y']=event.object.position.y;
      lesson10.originalPosition['z']=event.object.position.z;
      //禁止地图旋转等操作
      lesson10.controls.enabled = false;
      //高亮显示拖动对象
      lesson10.faceMaterial=event.object.material[0].clone();
      event.object.material[0].color.setHex( 0xffff00 );
    }
  },
  dragCallback: function (event) {
    if(event.object.position.y<61) event.object.position.y=61;
  },
  dragendCallback: function (event) {
    if(!lesson10.selection) return;
    lesson10.controls.enabled = true;
    if(event.object.material.length==6){
      for(i=0;i<6;i++){
        event.object.material[i]=lesson10.faceMaterial;
      }
      if(lesson10.droppable){
        lesson10.droppable.material.color.setHex(0xffffff);
        lesson10.droppable.material.opacity=0.1;
      } 
    }
    if(lesson10.droppable){
      event.object.position.x=lesson10.droppable.position.x;
      event.object.position.y=lesson10.droppable.position.y;
      event.object.position.z=lesson10.droppable.position.z;
      _xiangwei[_jizhuangxiang[event.object.name]]='';//源箱位置空
      console.log(_jizhuangxiang[event.object.name]+' 置空：'+_xiangwei[_jizhuangxiang[event.object.name]]);
      _xiangwei[lesson10.droppable.name]=event.object.name;//集装箱放在目标箱位内
      console.log(lesson10.droppable.name+' 包含：'+event.object.name);
      _jizhuangxiang[event.object.name]=lesson10.droppable.name;
      console.log(event.object.name+' 放在：'+lesson10.droppable.name);
      console.log(_xiangwei);
      console.log(_jizhuangxiang);
    }else{
      event.object.position.x=lesson10.originalPosition['x'];
      event.object.position.y=lesson10.originalPosition['y'];
      event.object.position.z=lesson10.originalPosition['z'];
    }
    lesson10.selection=null;
    lesson10.droppable=null;
  },
  addText: function(message,color="#0000ff",fontSize=200,position={x:500,y:1,z:150}){
    var loader = new THREE.FontLoader();
    loader.load( 'fonts/helvetiker_regular.typeface.json', function ( font ) {
      var xMid, text;
      var textShape = new THREE.BufferGeometry();
      var matDark = new THREE.LineBasicMaterial( {
        color: color,
        side: THREE.DoubleSide
      } );

      var matLite = new THREE.MeshBasicMaterial( {
        color: color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      } );

      var shapes = font.generateShapes( message, fontSize, 2 );

      var geometry = new THREE.ShapeGeometry( shapes );

      geometry.computeBoundingBox();

      xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );

      geometry.translate( xMid, 0, 0 );

      // make shape ( N.B. edge view not visible )

      textShape.fromGeometry( geometry );

      text = new THREE.Mesh( textShape, matLite );
      text.position.x = position.x;
      text.position.y=position.y;
      text.position.z = position.z;
      text.rotation.x = - Math.PI / 2;
      lesson10.scene.add( text );
    }); //end load function
  }
};

// Animate the scene
function animate() {
  requestAnimationFrame(animate);
  render();
  update();
}

// Update controls and stats
function update() {
  var delta = lesson10.clock.getDelta();

  lesson10.controls.update(delta);
}

// Render the scene
function render() {
  if (lesson10.renderer) {
    lesson10.renderer.render(lesson10.scene, lesson10.camera);
  }
}

// Initialize lesson on page load
function initializeLesson() {
  lesson10.init();
  animate();
}

function varDump(variable)
{
  var out = '';
  for (var i in variable) {
    out += i + ": " + variable[i] + "\n";
  }
  alert(out);
}

function getDistance(v1,v2){
  var dx = v1.x - v2.x;
  var dy = v1.y - v2.y;
  var dz = v1.z - v2.z;
  var d = Math.sqrt( dx * dx + dy * dy + dz * dz );
  return d;
}

function isDraggable(obj){
  //判断箱子是否容许拖动(箱子上方有箱子)
  var xw=_jizhuangxiang[obj.name];
  var pre5=xw.substr(0,5);
  var last1=xw.substr(5,1);
  if(parseInt(last1)<3){
    var xw_above=pre5+(parseInt(last1)+1).toString();
    if(_xiangwei[xw_above]!='') return false;
  }
  return true;
}

function isDroppable(obj){
  if(!obj) return false;
  //判断箱位是否含有箱子
  var jzx=_xiangwei[obj.name];
  if(jzx!='') return false;

  //下方箱位是否有箱子,无箱子则不可，如果有但和自己相同也不可
  var pre5=obj.name.substr(0,5);
  var last1=obj.name.substr(5,1);
  if(parseInt(last1)>1){
    var xw_below=pre5+(parseInt(last1)-1).toString();
    if(_xiangwei[xw_below]=='' || _xiangwei[xw_below]==lesson10.selection.name) return false;
  }
  return true;
}

if (window.addEventListener)
  window.addEventListener('load', initializeLesson, false);
else if (window.attachEvent)
  window.attachEvent('onload', initializeLesson);
else window.onload = initializeLesson;
