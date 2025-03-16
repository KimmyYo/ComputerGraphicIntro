// Each texture has it own bufferInfor, and texture 
// 1. Setup square frame buffer, bind texture, bind render buffer 
// 2. clean the buffer (null data frame buffer)
// 3. Setup sphere frame buffer 

// Objects 
// - Program Info (setup attribute, uniform locatino)
// - initWebGL, loadShader, initBuffers, initCubeMap

// Functions 
// - renderSquare, renderSphere 
// - FrameBuffer cleaning 
// - Lighting setup (uniform store)
// var canvas, gl;
// var program; 

// ground data 
var isSphere = false;
var g_points = [];
var g_normals = [];
var g_texcoord = [];
var g_index = 6;

var s_points = [];
var s_normals = [];
var s_texcoord = [];
var index = 0;
var modelViewMatrix, projectionMatrix, normalMatrix;

var LIGHT_X = 2, LIGHT_Y = 2, LIGHT_Z = 2; 
var lightPosition;
var square_texture, cube_texture;
function initBuffers(gl){

    var g_vertices = [
        vec4(-5, -1, -5, 1),
        vec4(5, -1, -5, 1),
        vec4(5, -1, 5, 1),
        vec4(-5, -1, 5, 1)
    ]; 
    isSphere = false;
    g_triangle(g_vertices[0], g_vertices[1], g_vertices[2]);
    g_triangle(g_vertices[0], g_vertices[2], g_vertices[3]);
    

    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];
  
    g_texcoord.push(texCoord[0], texCoord[1], texCoord[2], texCoord[0], texCoord[2], texCoord[3]);

  

    var va = vec4(0.0, 0.0, -1.0,1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333,1);

    isSphere = true;
    tetrahedron(va, vb, vc, vd, 6);
    for(let i = 0; i < index; i+=6){
        s_texcoord.push(texCoord[0], texCoord[1], texCoord[2], texCoord[0], texCoord[2], texCoord[3]);
    }
    
    // binding buffer should also be update outside 
    var g_pos_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, g_pos_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(g_points), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    
    var g_nor_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, g_nor_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(g_normals), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var g_texc_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, g_texc_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(g_texcoord), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    
    var s_pos_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, s_pos_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(s_points), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var s_nor_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, s_nor_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(s_normals), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var s_texc_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, s_texc_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(s_texcoord), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

        
    return {
        square: {
            position: g_pos_buffer,
            normals: g_nor_buffer,
            texcoord: g_texc_buffer,
        },
        sphere: {
            position: s_pos_buffer,
            normals: s_nor_buffer,
            texcoord: s_texc_buffer
        }
    }
}
lightPosition = vec4(LIGHT_X, LIGHT_Y, LIGHT_Z, 1.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 ); 
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;

var ambientProduct = mult(lightAmbient, materialAmbient);
var diffuseProduct = mult(lightDiffuse, materialDiffuse);
var specularProduct = mult(lightSpecular, materialSpecular);
function initLighting(gl, programInfo) {
    gl.useProgram(programInfo.program);
    for(let i = 0; i < 3; i++){
        lightPosition[i] = normalize(lightPosition[i]);
    }

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv( programInfo.uniformLocations.ambientProduct,flatten(ambientProduct) );
    gl.uniform4fv( programInfo.uniformLocations.diffuseProduct,flatten(diffuseProduct) );
    gl.uniform4fv( programInfo.uniformLocations.specularProduct,flatten(specularProduct) );
    gl.uniform4fv(programInfo.uniformLocations.lightPosition, flatten(lightPosition));
    gl.uniform1f(programInfo.uniformLocations.materialShininess, materialShininess);
}   


// clean default frame buffer 
// this is for the depth texture
function initFrameBuffer(gl) {
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const width = 256;
    const height = 256;
    gl.texImage2D(
        gl.TEXTURE_2D,
        0, // level
        gl.RGBA, // internalFormat
        width,
        height,
        0, // border
        gl.RGBA, // format
        gl.UNSIGNED_BYTE, // type
        null, // data
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0, // attachmentPoint
        gl.TEXTURE_2D,
        texture,
        0 // level 
    );

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { 
        framebuffer: framebuffer, 
        texture: texture, // texture for framebuffer  
        height: height, 
        width: width};
}

function initCubeMapFrameBuffer(gl, size) {
   
    const framebufferList = [];
    const renderbufferList = [];
    const cubeTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);


    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


    // Initialize each face of the cube map texture
    for (let i = 0; i < 6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    
    for(let i = 0; i < 6; i++){
        framebufferList[i] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferList[i]);

        renderbufferList[i] = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbufferList[i]);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbufferList[i]);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, cubeTexture, 0);
       
    }

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    for(let i = 0; i < 6; i++){
        // gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    return { 
        framebuffer: framebufferList, 
        texture: cubeTexture, 
        size: size 
    };
}


function initTexture2D(gl){
    var texSize = 256;
    var numChecks = 20;
    var c;
    square_texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, square_texture);

    var image2 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            var patchx = Math.floor(i/(texSize/numChecks));
            var patchy = Math.floor(j/(texSize/numChecks));
            if(patchx%2 ^ patchy%2) c = 255;
            else c = 0;
           
            //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
            image2[4*i*texSize+4*j] = c;
            image2[4*i*texSize+4*j+1] = c + 20 ;
            image2[4*i*texSize+4*j+2] = c;
            image2[4*i*texSize+4*j+3] = 255;
        }
    }


    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize ,0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
  
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    
    
    return {texture: square_texture};
}

function initTextureCube(gl){
    var texSize = 256;
    var numChecks = 10;
    var c;
    cube_texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, cube_texture);

    var image1 = new Uint8Array(4 * texSize * texSize);

    for (var i = 0; i < texSize; i++) {
        for (var j = 0; j < texSize; j++) {
            var index = 4 * i * texSize + 4 * j;
            image1[index] =  100;    // Red channel
            image1[index + 1] = 144; // Green channel
            image1[index + 2] = 55; // Blue channel
            image1[index + 3] = 255; // Alpha channel (opaque)
        }
    }

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize ,0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
  
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    

    return {texture: cube_texture};
}

// function initShadowTexture(gl, programInfo, fboDepth){
       

// }
function shaderTextureAndFramebuffer(gl){

    var depthTexture = gl.createTexture();
    var depthTextureSize = 2048;

    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, depthTextureSize, depthTextureSize, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);

    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // configure frame buffer
    var depthFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);


    const unusedTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, unusedTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        depthTextureSize,
        depthTextureSize,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,        // target
        gl.COLOR_ATTACHMENT0,  // attachment point
        gl.TEXTURE_2D,         // texture target
        unusedTexture,         // texture
        0);                    // mip level
  
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.log("The created frame buffer is invalid: " + status.toString());
    }

    
    return {
        framebuffer: depthFramebuffer,
        texture: depthTexture
    }
}

function renderCheckerBoard(gl, programInfo, buffers, texture, framebufferInfo){ 

   
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.square.position);
    gl.vertexAttribPointer(programInfo.attributeLocations.vertexPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attributeLocations.vertexPosition);

    // gl.bindBuffer(gl.ARRAY_BUFFER, buffers.square.normals);
    // gl.vertexAttribPointer(programInfo.attributeLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(programInfo.attributeLocations.vertexNormal);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.square.texcoord);
    gl.vertexAttribPointer(programInfo.attributeLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attributeLocations.textureCoord);

    gl.uniform4fv(
        gl.getUniformLocation(programInfo.program, 'u_colorMult'), flatten(vec4(1.0, 0.0, 0.0, 1.0))
    );

    // gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferInfo.framebuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.g_texture, 0);
    

    // gl.viewport(0, 0,canvas.width, canvas.height);
    // gl.clearColor(1, 1, 1, 1);
    // // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_index);

    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

   
}

function renderSphere(gl, programInfo, buffers, texture, framebufferInfo){
    // position buffer 

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphere.position);
    gl.vertexAttribPointer(programInfo.attributeLocations.vertexPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attributeLocations.vertexPosition);

    gl.uniform4fv(
        gl.getUniformLocation(programInfo.program, 'u_colorMult'), flatten(vec4(0.0, 0.0, 1.0, 1.0))
    );

    // gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphere.normals);
    // gl.vertexAttribPointer(programInfo.attributeLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(programInfo.attributeLocations.vertexNormal);

    // gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphere.texcoord);
    // gl.vertexAttribPointer(programInfo.attributeLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(programInfo.attributeLocations.textureCoord);
  
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture( gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.g_texture, 1);
    gl.drawArrays(gl.TRIANGLES, 0, index);
   
    
}

var program, shadowProgram, programs, fbo, buffers, gl, canvas;
function degToRad(d) {
    return d * Math.PI / 180;
  }
function main(){
    canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl){alert("Bowser doesn't support WebGL")};

    const ext = gl.getExtension('WEBGL_depth_texture');
    if (!ext) {
      return alert('need WEBGL_depth_texture');
    }

    // set up normal program
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    // gl.useProgram( program );
    if (!program) {
        console.error("Failed to initialize shaders.");
        return;
    }

    // set up shadow program
    shadowProgram = initShaders(gl, "shadow-vertex-shader", "shadow-fragment-shader");
    // gl.useProgram(shadowProgram);

    if (!shadowProgram) {
        console.error("Failed to initialize shadow shaders.");
        return;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    // clean canvas 
    gl.viewport( 0, 0, canvas.width, canvas.height ); 
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    // gl.enable(gl.CULL_FACE);
    //

    const programInfo = {
        program: program, 
        attributeLocations: {
            vertexPosition: gl.getAttribLocation(program, 'vPosition'),
            vertexNormal: gl.getAttribLocation(program, 'vNormal'),
            textureCoord: gl.getAttribLocation(program, 'vTexCoord')
        },
        uniformLocations: {
            // transform matrices
            modelViewMatrix: gl.getUniformLocation(program, 'modelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(program, 'projectionMatrix'),
            normalMatrix: gl.getUniformLocation(program, 'normalMatrix'),
            textureMatrix: gl.getUniformLocation(program, 'matrixShadow'),
            // lights
            lightPosition: gl.getUniformLocation(program, 'lightPosition'),
            ambientProduct: gl.getUniformLocation(program, 'ambientProduct'),
            diffuseProduct: gl.getUniformLocation(program, 'diffuseProduct'),
            specularProduct: gl.getUniformLocation(program, 'specularProduct'),
            materialShininess: gl.getUniformLocation(program, 'shininess'),

            // textures unform sampler
            g_texture: gl.getUniformLocation(program, 'g_texture'),
            u_projectedTexture: gl.getUniformLocation(program, 'shadow_texture'),
            u_colorMult: gl.getUniformLocation(program, 'u_colorMult'),
            // fragment shader
            lightView_Position: gl.getUniformLocation(program, 'lightView_Position'),
            // u_bias: gl.getUniformLocation(program, 'u_bias'),

        }
    } 

    const shadowProgramInfo = {
        program: shadowProgram,
        attributeLocations: {
            vertexPosition: gl.getAttribLocation(shadowProgram, 'a_position'),
        },
        uniformLocations: {
            mvp: gl.getUniformLocation(shadowProgram, 'mvp')
        }
    };


    // buffers set up 
    buffers = initBuffers(gl);
    console.log(buffers);
   
    // ground and sphere framebuffer set up
    // const framebufferInfo = initFrameBuffer(gl);
    // const framebufferCubeInfo = initCubeMapFrameBuffer(gl, 400);
    programs = {
        originProgram: programInfo,
        shadowProgram: shadowProgramInfo
    };
  
    document.getElementById('x-light').oninput = function(event){
        if(event.target.value != 0)
            LIGHT_X = event.target.value / 5;
        LIGHT_X = normalize(LIGHT_X);
        gl.uniform4fv(programInfo.uniformLocations.lightPosition, flatten(vec4(LIGHT_X, LIGHT_Y, LIGHT_Z, 1.0)));
        
    }
    document.getElementById('y-light').oninput = function(event){
    if(event.target.value != 0)
        LIGHT_Y = event.target.value / 2;
    LIGHT_Y = normalize(LIGHT_Y);
    gl.uniform4fv(programInfo.uniformLocations.lightPosition, flatten(vec4(LIGHT_X, LIGHT_Y, LIGHT_Z, 1.0)));
    }
    document.getElementById('z-light').oninput = function(event){
        if(event.target.value != 0)
            LIGHT_Z = event.target.value / 5;
        LIGHT_Z = normalize(LIGHT_Z);
        gl.uniform4fv(programInfo.uniformLocations.lightPosition, flatten(vec4(LIGHT_X, LIGHT_Y, LIGHT_Z, 1.0)));
    }   
    document.getElementById('d-light').oninput = function(event){
        if(event.target.value != 0)
            materialShininess = event.target.value;
        
        gl.uniform1f(programInfo.uniformLocations.materialShininess, materialShininess);
    }   

   
    initLighting(gl, programs.originProgram);
 
    
    render();
}
var lightModelViewMatrix, lightProjectionMatrix;
function setMatrixMLP(){
    // light source 
    lightModelViewMatrix = lookAt(
        [LIGHT_X, LIGHT_Y, LIGHT_Z],
        [0, 0, 0],
        [0, 1, 0]
    );
    lightProjectionMatrix = perspective(60, 1, 5, 1000);

    var matrixMLP = mult(lightProjectionMatrix, lightModelViewMatrix);
    return matrixMLP;

}function checkFramebufferStatus(gl) {
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    switch (status) {
        case gl.FRAMEBUFFER_COMPLETE:
            console.log("Framebuffer complete");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            console.error("Framebuffer incomplete: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            console.error("Framebuffer incomplete: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
            break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            console.error("Framebuffer incomplete: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
            break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
            console.error("Framebuffer incomplete: FRAMEBUFFER_UNSUPPORTED");
            break;
        default:
            console.error("Framebuffer incomplete: Unknown error");
    }
}
function setMatrixShadow(){

   
    // var biasMatrix = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 
    //     0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);
    
    // var matrixShadow = mult(biasMatrix, inverse(setMatrixMLP()));
    // // var matrixShadow =matrixMLP;
    var matrixShadow = setMatrixMLP();
    // matrixShadow = mult(matrixShadow, translate(0.5, 0.5, 0.5));
    // matrixShadow = mult(matrixShadow, scale(0.5, 0.5, 0.5));
    return matrixShadow;
}
var depth_buffer;
function renderDepthObjects() {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphere.position);
    gl.vertexAttribPointer(programs.shadowProgram.attributeLocations.vertexPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programs.shadowProgram.attributeLocations.vertexPosition);
    gl.drawArrays(gl.TRIANGLES, 0, index);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.square.position);
    gl.vertexAttribPointer(programs.shadowProgram.attributeLocations.vertexPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programs.shadowProgram.attributeLocations.vertexPosition);
    gl.drawArrays(gl.TRIANGLES, 0, g_points.length);



}

function render(){
    
    
    // render mapping 
    var depthMapping = shaderTextureAndFramebuffer(gl);
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthMapping.framebuffer);
    gl.viewport(0, 0, 2048, 2048);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(programs.shadowProgram.program);
    gl.uniformMatrix4fv(
        programs.shadowProgram.uniformLocations.mvp, 
        false, flatten(setMatrixMLP()));

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    { // light projection 
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphere.position);
        gl.vertexAttribPointer(programs.originProgram.attributeLocations.vertexPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programs.originProgram.attributeLocations.vertexPosition);
        gl.drawArrays(gl.TRIANGLES, 0, index);
        // gl.bindBuffer(gl.ARRAY_BUFFER, buffers.square.position);
        // gl.vertexAttribPointer(programs.originProgram.attributeLocations.vertexPosition, 4, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(programs.originProgram.attributeLocations.vertexPosition);
        // gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
   
    // Object 
    gl.useProgram(programs.originProgram.program);
    gl.enable(gl.DEPTH_TEST);
    modelViewMatrix = lookAt(
        [0, 1, 3],
        [0, 0, 0],
        [0, 1, 0]
    );
    projectionMatrix = perspective(90, canvas.width / canvas.height, 1, 20);
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];

    gl.uniformMatrix4fv(
        gl.getUniformLocation(programs.originProgram.program, 'modelViewMatrix'),
        false,
        flatten(modelViewMatrix)
    );
    gl.uniformMatrix4fv(
        gl.getUniformLocation(programs.originProgram.program, 'projectionMatrix'),
        false,
        flatten(projectionMatrix)
    );
    gl.uniformMatrix4fv(
        gl.getUniformLocation(programs.originProgram.program, 'matrixShadow'),
        false,
        flatten(setMatrixShadow())
    );
    gl.uniformMatrix3fv(
        gl.getUniformLocation(programs.originProgram.program, 'normalMatrix'),
        false,
        flatten(normalMatrix)
    );
    
    
    gl.activeTexture( gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shaderTextureAndFramebuffer(gl).texture);
    gl.uniform1i(
        gl.getUniformLocation(programs.originProgram.program, 'shadow_texture'),
        0
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    { // actual object drawing 
        //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // checkFramebufferStatus(gl);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        {// square 
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.square.position);
            gl.vertexAttribPointer(programs.originProgram.attributeLocations.vertexPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programs.originProgram.attributeLocations.vertexPosition);
            
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.square.normals);
            gl.vertexAttribPointer(programs.originProgram.attributeLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programs.originProgram.attributeLocations.vertexNormal);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.square.texcoord);
            gl.vertexAttribPointer(programs.originProgram.attributeLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programs.originProgram.attributeLocations.textureCoord);
        
            gl.uniform4fv(
                gl.getUniformLocation(programs.originProgram.program, 'u_colorMult'), flatten(vec4(1.0, 1.0, 0.0, 1.0))
            );

            gl.activeTexture( gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, initTexture2D(gl).texture);
            gl.uniform1i(programs.originProgram.uniformLocations.g_texture, 1);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        {
            // sphere
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphere.position);
            gl.vertexAttribPointer(programs.originProgram.attributeLocations.vertexPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programs.originProgram.attributeLocations.vertexPosition);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphere.normals);
            gl.vertexAttribPointer(programs.originProgram.attributeLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programs.originProgram.attributeLocations.vertexNormal);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphere.texcoord);
            gl.vertexAttribPointer(programs.originProgram.attributeLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(programs.originProgram.attributeLocations.textureCoord);
            gl.uniform4fv(
                gl.getUniformLocation(programs.originProgram.program, 'u_colorMult'), flatten(vec4(1.0, 1.0, 1.0, 1.0))
            );
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, initTextureCube(gl).texture);
            gl.uniform1i(programs.originProgram.uniformLocations.g_texture, 0);
            gl.drawArrays(gl.TRIANGLES, 0, index);
        }
    }
    


    requestAnimationFrame(render);
}

window.onload = main();



function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, count){
    if ( count > 0 ) {
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 ); 
    }
    else {
        triangle( a, b, c );
    }
}

function triangle(a, b, c){
   
        s_points.push(a);
        s_points.push(b);
        s_points.push(c);
    
        var t1 = subtract(b, a);
        var t2 = subtract(c, a);
        var normal = normalize(cross(t2, t1));
        normal = vec3(normal);
        // normal[3]  = 0.0;
    
        s_normals.push(a[0], a[1], a[2]);
        s_normals.push(b[0], b[1], b[2]);
        s_normals.push(c[0], c[1], c[2]);
       
        index += 3;

}
function quad(a, b, c, d, n){
   divideTriangle(a, b, c, n);
   divideTriangle(a, c, d, n);
}
function g_triangle(a, b, c){
    g_points.push(a);
    g_points.push(b);
    g_points.push(c);

    var t1 = subtract(b, c);
    var t2 = subtract(b, a);
    var normal = normalize(cross(t2, t1));
    normal = vec3(normal);

    g_normals.push(normal, normal, normal);
    // g_normals.push(0, 1, 1);
    // g_normals.push(0, 1, 1);
    // g_normals.push(0, 1, 1);

}