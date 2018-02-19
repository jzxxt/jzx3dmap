/**
 *
 * WebGL With Three.js - Lesson 10 - Drag and Drop Objects
 * http://www.script-tutorials.com/webgl-with-three-js-lesson-10/
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2015, Script Tutorials
 * http://www.script-tutorials.com/
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

var lesson10 = {
  scene: null, camera: null, renderer: null,
  container: null, controls: null, dragAndDropControls:null,
  clock: null, stats: null, droppable:null, tmpDroppable:null,  
  plane: null, selection: null, offset: new THREE.Vector3(), objects: [], faceColor:[],
  raycaster: new THREE.Raycaster(), mouse: new THREE.Vector2(),

  init: function() {

    // Create main scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xcce0ff, 0.0002);

    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;

    // Prepare perspective camera
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 10000;
    this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    this.scene.add(this.camera);
    this.camera.position.set(-300,350,800);
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

    /*
    // Prepare stats
    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '50px';
    this.stats.domElement.style.bottom = '50px';
    this.stats.domElement.style.zIndex = 1;
    this.container.appendChild( this.stats.domElement );
    */

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

    var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
    floorTexture.repeat.set( 80, 80 );
    // DoubleSide: render texture on both sides of mesh
    var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
    var floorGeometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.rotation.x = Math.PI / 2;
    this.scene.add(floor);

    /*
    // Add 100 random objects (spheres)
    var object, material, radius;
    var objGeometry = new THREE.SphereGeometry(1, 24, 24);
    for (var i = 0; i < 50; i++) {
      material = new THREE.MeshPhongMaterial({color: Math.random() * 0xffffff});
      material.transparent = true;
      object = new THREE.Mesh(objGeometry.clone(), material);
      this.objects.push(object);

      radius = Math.random() * 4 + 2;
      object.scale.x = radius;
      object.scale.y = radius;
      object.scale.z = radius;

      object.position.x = Math.random() * 50 - 25;
      object.position.y = Math.random() * 50 - 25;
      object.position.z = Math.random() * 50 - 25;

      this.scene.add(object);
    }
    */

    // GEOMETRY //
    var xiangweiBoxGeometry = new THREE.BoxGeometry( 100, 120, 240);
    var xiangweiBoxMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:1});
    var boxGeometry = new THREE.BoxGeometry( 100, 120, 240);
    for(i=1;i<20;i++){
      
      var boxMaterials = this.getBoxMaterial('TBJU001234'); 
      box = new THREE.Mesh( boxGeometry, boxMaterials);
      this.objects.push(box);
      //box.position.set(-500+i*110, 61, 0);
      box.position.x = -500+i*110;
      box.position.y = 61;
      box.position.z = 0;
      this.scene.add( box ); 
      
      /*
      xiangwei = new THREE.Mesh( xiangweiBoxGeometry, xiangweiBoxMaterial);
      //this.objects.push(xiangwei);
      xiangwei.position.x = -500+i*110;
      xiangwei.position.y = 61;
      xiangwei.position.z = 0;
      this.scene.add( xiangwei ); 

      xiangwei = new THREE.Mesh( xiangweiBoxGeometry, xiangweiBoxMaterial);
      //this.objects.push(xiangwei);
      xiangwei.position.x = -500+i*110;
      xiangwei.position.y = 61+122;
      xiangwei.position.z = 0;
      this.scene.add( xiangwei ); 

      xiangwei = new THREE.Mesh( xiangweiBoxGeometry, xiangweiBoxMaterial);
      //this.objects.push(xiangwei);
      xiangwei.position.x = -500+i*110;
      xiangwei.position.y = 61+244;
      xiangwei.position.z = 0;
      this.scene.add( xiangwei ); 
      */
    }

    this.dragAndDropControls = new THREE.DragControls( this.objects, this.camera, this.renderer.domElement );
    this.dragAndDropControls.addEventListener( 'dragstart', this.dragStartCallback );
    this.dragAndDropControls.addEventListener( 'drag', this.dragCallback );
    this.dragAndDropControls.addEventListener( 'dragend', this.dragendCallback );
  },

  getBoxMaterial: function(text) {
    var boxMaterialArray = [];
    boxMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x3355ff } ) );
    boxMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x5577ff } ) );
    boxMaterialArray.push( this.genFaceMaterial('#5599ff',this.renderer,text) );
    boxMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x7799ff } ) );
    boxMaterialArray.push( this.genFaceMaterial('#3333ff',this.renderer,text) );
    boxMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x99aaff } ) );

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
    event.preventDefault();
    if(lesson10.selection==null) return;
    lesson10.mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

    lesson10.raycaster.setFromCamera( lesson10.mouse, lesson10.camera );

    var intersects = lesson10.raycaster.intersectObjects( lesson10.objects );

    if ( intersects.length > 1 ) {
      var distance=1000;//箱子的最窄边
      var tmpDistance=0;
      for(i=1;i<intersects.length;i++){
        tmpDistance=getDistance(intersects[i].object.position,lesson10.selection.position);
        console.log('->'+tmpDistance);
        if(tmpDistance<distance){
          
          distance=tmpDistance;
          lesson10.tmpDroppable=intersects[i].object;
        }
      }
      if(lesson10.droppable!==lesson10.tmpDroppable){
        for(i=0;i<6;i++){
          switch (i) {
            case 0:
            case 1:
              lesson10.tmpDroppable.material[i].color.setHex( 0x006600 );
              break;
            case 5:
              lesson10.tmpDroppable.material[i].color.setHex( 0x006600 );
              break;
            default:
              lesson10.tmpDroppable.material[i].color.setHex( 0xffff00 );
              break;
          }
          if(lesson10.droppable && lesson10.droppable!==lesson10.selection) lesson10.droppable.material[i].color.setHex(lesson10.faceColor[i]);
        }
        lesson10.droppable=lesson10.tmpDroppable;
      }
    }
  },
  /*
  onDocumentMouseDown: function (event) {
    // Get mouse position
    var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Get 3D vector from 3D mouse position using 'unproject' function
    var vector = new THREE.Vector3(mouseX, mouseY, 1);
    vector.unproject(lesson10.camera);

    // Set the raycaster position
    lesson10.raycaster.set( lesson10.camera.position, vector.sub( lesson10.camera.position ).normalize() );

    // Find all intersected objects
    var intersects = lesson10.raycaster.intersectObjects(lesson10.objects);

    if (intersects.length > 0) {
      // Disable the controls
      lesson10.controls.enabled = false;

      // Set the selection - first intersected object
      lesson10.selection = intersects[0].object;

      // Calculate the offset
      var intersects = lesson10.raycaster.intersectObject(lesson10.plane);
      lesson10.offset.copy(intersects[0].point).sub(lesson10.plane.position);
    }
  },
  onDocumentMouseMove: function (event) {
    event.preventDefault();

    // Get mouse position
    var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Get 3D vector from 3D mouse position using 'unproject' function
    var vector = new THREE.Vector3(mouseX, mouseY, 1);
    vector.unproject(lesson10.camera);

    // Set the raycaster position
    lesson10.raycaster.set( lesson10.camera.position, vector.sub( lesson10.camera.position ).normalize() );

    if (lesson10.selection) {
      // Check the position where the plane is intersected
      var intersects = lesson10.raycaster.intersectObject(lesson10.plane);
      
      // Reposition the object based on the intersection point with the plane
      lesson10.selection.position.copy(intersects[0].point.sub(lesson10.offset));

    } else {
      // Update position of the plane if need
      var intersects = lesson10.raycaster.intersectObjects(lesson10.objects);
      if (intersects.length > 0) {
        lesson10.plane.position.copy(intersects[0].object.position);
        lesson10.plane.lookAt(lesson10.camera.position);
      }
    }
  },
  onDocumentMouseUp: function (event) {
    // Enable the controls
    lesson10.controls.enabled = true;
    lesson10.selection = null;
  },
  */
  dragStartCallback: function (event) {
    if(event.object.material.length==6){
      lesson10.selection=event.object;
      lesson10.controls.enabled = false;
      for(i=0;i<6;i++){
        lesson10.faceColor[i]=event.object.material[i].color.getHex();
        switch (i) {
            case 0:
            case 1:
              event.object.material[i].color.setHex( 0x006600 );
              break;
            case 5:
              event.object.material[i].color.setHex( 0x006600 );
              break;
            default:
              event.object.material[i].color.setHex( 0xffff00 );
              break;
          }  
      }
    }
  },
  dragCallback: function (event) {
    if(event.object.position.y<61) event.object.position.y=61;

    /*
    for (var vertexIndex = 0; vertexIndex < event.object.geometry.vertices.length; vertexIndex++)
    {    
        console.log('vertexIndex');  
        var localVertex = event.object.geometry.vertices[vertexIndex].clone();
        var globalVertex = event.object.matrix.multiplyVector3(localVertex);
        var directionVector = globalVertex.subSelf( event.object.position );

        var ray = new THREE.Ray( event.object.position, directionVector.clone().normalize() );
        var collisionResults = ray.intersectObjects( collidableMeshList );
        if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
        {
            alert('hit');
        }
    }
    */
  },
  dragendCallback: function (event) {
    lesson10.controls.enabled = true;
    lesson10.selection=null;
    if(event.object.material.length==6){
      for(i=0;i<6;i++){
        event.object.material[i].color.setHex(lesson10.faceColor[i]);
        if(lesson10.droppable) lesson10.droppable.material[i].color.setHex(lesson10.faceColor[i]);
      }
    }
    if(lesson10.droppable){
      event.object.position.x=lesson10.droppable.position.x;
      event.object.position.y=lesson10.droppable.position.y+121;
      event.object.position.z=lesson10.droppable.position.z;
      
      lesson10.droppable=null;
    }
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
  console.log(d);
  return d;
}

if (window.addEventListener)
  window.addEventListener('load', initializeLesson, false);
else if (window.attachEvent)
  window.attachEvent('onload', initializeLesson);
else window.onload = initializeLesson;
