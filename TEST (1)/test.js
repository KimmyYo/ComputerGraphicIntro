// 1. Set cylinder vertices 
// 2. Buffers, mvp matrices
// 3. Shadows 
// 4. Lights and materials 


var points = [];
var normals = [];
var index = 0;
var canvas, gl, program, buffers; 

var modelViewMatrix, projectionMatrix, normalMatrix, transformedMatrix;

var lightPosition, lightAmbient, lightDiffuse, lightSpecular; 
var materialAmbient, materialDiffuse, materialSpecular, materialShininess;
var LIGHT_X = 1;
var LIGHT_Y = 1;
var LIGHT_Z = 1;

lightPosition = vec4(LIGHT_X, LIGHT_Y, LIGHT_Z, 1.0 );
lightAmbient = vec4(0.5, 0.5, 0.1, 0.8 );
lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 ) ;

materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
materialDiffuse = vec4( 0.0, 0.0, 0.0, 1.0 );
materialSpecular = vec4( 0.8, 0.8, 0.8, 1.0 );
materialShininess = 20.0;

var ambientProduct, diffuseProduct, specularProduct; 


function setCylinder() {
    var radius = 0.2; 
    var height = 0.6; 
    var segments = 360;
    var dPhi = 2 * Math.PI / segments;
    var phi;

    // Top face
    for (let i = 0; i < segments; i++) {
        phi = i * dPhi;
        var nextPhi = (i + 1) * dPhi;

        var a = vec4(0.0, height, 0.0, 1.0);
        var b = vec4(Math.cos(phi) * radius, height, Math.sin(phi) * radius, 1.0);
        var c = vec4(Math.cos(nextPhi) * radius, height, Math.sin(nextPhi) * radius, 1.0);

        var normal = vec4(0, 1, 0, 0);
        triangle(a, b, c, normal, normal, normal);
    }

    // Bottom face
    for (let i = 0; i < segments; i++) {
        phi = i * dPhi;
        var nextPhi = (i + 1) * dPhi;

        var a = vec4(0.0, 0.0, 0.0, 1.0);
        var b = vec4(Math.cos(nextPhi) * radius, 0.0, Math.sin(nextPhi) * radius, 1.0);
        var c = vec4(Math.cos(phi) * radius, 0.0, Math.sin(phi) * radius, 1.0);

        var normal = vec4(0, -1, 0, 0);
        triangle(a, b, c, normal, normal, normal);
    }
    var finalPoint;
    // Side faces
    for (let i = 0; i < segments; i++) {
        phi = i * dPhi;
        var nextPhi = (i + 1) * dPhi;

        var a = vec4(Math.cos(phi) * radius, height, Math.sin(phi) * radius, 1.0);
        var b = vec4(Math.cos(phi) * radius, 0.0, Math.sin(phi) * radius, 1.0);
        var c = vec4(Math.cos(nextPhi) * radius, 0.0, Math.sin(nextPhi) * radius, 1.0);
        var d = vec4(Math.cos(nextPhi) * radius, height, Math.sin(nextPhi) * radius, 1.0);

        var normal1 = vec4(Math.cos(phi), 0.0, Math.sin(phi), 0.0);
        var normal2 = vec4(Math.cos(nextPhi), 0.0, Math.sin(nextPhi), 0.0);

        triangle(a, b, c, normal1, normal1, normal2);
        triangle(a, c, d, normal1, normal2, normal2);
        
        if(i == segments - 1) finalPoint = d;
    }

    var planeHeight = 0; // Position the plane below the cylinder

    // Four corners of the plane
    var p1 = vec4(-1.0, planeHeight, -1.0, 1.0);
    var p2 = vec4(1.0, planeHeight, -1.0, 1.0);
    var p3 = vec4(1.0, planeHeight, 1.0, 1.0);
    var p4 = vec4(-1.0, planeHeight, 1.0, 1.0);

    // Normals for the plane
    var planeNormal = vec4(0, 1, 0, 0);
    var finalNext = vec4(finalPoint[0], 0.0, finalPoint[2], 1.0);
    var finalNextNext = vec4(finalPoint[0] - 0.2, 0.0, finalPoint[2], 1.0);
    // Create two triangles for the plane
    triangle(finalPoint, finalNext, finalNextNext, planeNormal, planeNormal, planeNormal);
    triangle(p1, p2, p3, planeNormal, planeNormal, planeNormal);
    triangle(p1, p3, p4, planeNormal, planeNormal, planeNormal);
    triangle(p1, p3, p4, planeNormal, planeNormal, planeNormal);
}

function triangle(a, b, c, na, nb, nc) {
    points.push(a, b, c);
    normals.push(na, nb, nc);
    index += 3;
}



function initBuffers(gl){
   
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    return {
        position: positionBuffer, 
        normal: normalBuffer
    }
}

function initLighting(){
 
}
function initDepthTextureAndFramebuffer(){
    // Depth framebuffer and texture set up 
    var depthTexture = gl.createTexture();
    var depthTextureSize = 512; 
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,      // target
        0,                  // mip level
        gl.DEPTH_COMPONENT, // internal format
        depthTextureSize,   // width
        depthTextureSize,   // height
        0,                  // border
        gl.DEPTH_COMPONENT, // format
        gl.UNSIGNED_INT,    // type
        null);   

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var depthFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0
    );

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.log("The created frame buffer is invalid: " + status.toString());
    }

    return {
        framebuffer: depthFramebuffer,
        texture: depthTexture
    }


}
var lightModelViewMatrix, lightProjectionMatrix;
function setMatrixMLP(){
    var mvp = mat4();
    lightModelViewMatrix = lookAt([LIGHT_X, LIGHT_Y, LIGHT_Z], [0, 0, 0], [0, 1, 0]);
    lightProjectionMatrix = perspective(60, 1, 0.2, 10);

    mvp = mult(lightProjectionMatrix, lightModelViewMatrix);

    return mvp;
}
window.onload = main();


function main(){
    // Initialization 
    canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL(canvas);

    if(!gl) {alert("Browser doesn't support WebGL")};

    const ext = gl.getExtension('WEBGL_depth_texture');
    if (!ext) {
      return alert('need WEBGL_depth_texture');
    }
 
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);


    setCylinder();


    program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    // gl.useProgram(program);

    shadowProgram = initShaders(gl, 'shadow-vertex-shader', 'shadow-fragment-shader');

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.depthFunc(gl.LEQUAL);

    // Depth Mapping 
    var depthMapping = initDepthTextureAndFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthMapping.framebuffer);
    gl.viewport(0, 0, 2048, 2048);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shadowProgram);
    gl.uniformMatrix4fv(
        gl.getUniformLocation(shadowProgram, 'mvp'), false, flatten(setMatrixMLP())
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    {

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
        var s_vPosition = gl.getAttribLocation(shadowProgram, 'vPosition');
        gl.vertexAttribPointer(s_vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(s_vPosition);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, index); 
    }


    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    // Buffers Setup 
    // Program Attributes and Varyings
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, 'vPosition');
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, 'vNormal');
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var matrixShadow = mat4();
    matrixShadow = mult(setMatrixMLP(), matrixShadow);
    matrixShadow = mult(matrixShadow, scalem(0.5, 0.5, 0.5));
    matrixShadow = mult(matrixShadow, translate(0.5, 0.5, 0.5));
    gl.uniformMatrix4fv(
        gl.getUniformLocation(program, 'matrixShadow'),
        false,
        flatten(matrixShadow)
    );

    modelViewMatrix = lookAt([1, 0.6, 2], [0, 0, 0], [0, 1, 0])
    gl.uniformMatrix4fv(
        gl.getUniformLocation(program, 'modelViewMatrix'), false,
        flatten(modelViewMatrix)
    )
    projectionMatrix = perspective(45, 1, 0.2, 100);
    gl.uniformMatrix4fv(
        gl.getUniformLocation(program, 'projectionMatrix'), false,
        flatten(projectionMatrix)
    )

    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    gl.uniformMatrix3fv(
        gl.getUniformLocation(program, 'normalMatrix'), false,
        flatten(normalMatrix)
    )


    // gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, depthMapping.texture);
    gl.uniform1i(
        gl.getUniformLocation(program, 'shadow'),
        1
    );
    // initLighting();
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv( gl.getUniformLocation(program,
        "ambientProduct"),flatten(ambientProduct) );
     gl.uniform4fv( gl.getUniformLocation(program,
        "diffuseProduct"),flatten(diffuseProduct) );
     gl.uniform4fv( gl.getUniformLocation(program,
        "specularProduct"),flatten(specularProduct) );
     gl.uniform4fv( gl.getUniformLocation(program,
        "lightPosition"),flatten(lightPosition) );
     gl.uniform1f( gl.getUniformLocation(program,
        "shininess"),materialShininess );
    
    document.getElementById('light-s').oninput = function(event){
        lightPosition = vec4(LIGHT_X, LIGHT_Y, LIGHT_Z, 1.0 );
        lightAmbient = vec4(0.5, 0.5, 0.1, 0.8 );
        lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
        lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 ) ;
    
        materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
        materialDiffuse = vec4( 0.0, 0.0, 0.0, 1.0 );
        materialSpecular = vec4( 0.8, 0.8, 0.8, 1.0 );
        materialShininess = event.target.value;
    
    
        gl.uniform4fv( gl.getUniformLocation(program,
            "ambientProduct"),flatten(ambientProduct) );
         gl.uniform4fv( gl.getUniformLocation(program,
            "diffuseProduct"),flatten(diffuseProduct) );
         gl.uniform4fv( gl.getUniformLocation(program,
            "specularProduct"),flatten(specularProduct) );
         gl.uniform4fv( gl.getUniformLocation(program,
            "lightPosition"),flatten(lightPosition) );
         gl.uniform1f( gl.getUniformLocation(program,
            "shininess"),materialShininess );
    }   
    render();

}
var theta = 90;

function render(){
    theta += 0;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    transformedMatrix = mult(mat4(), rotate(theta, [0, 1, 0]));
    gl.uniformMatrix4fv(
        gl.getUniformLocation(program, 'transformedMatrix'), false,
        flatten(transformedMatrix)
    )
   
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, index);
    requestAnimationFrame(render);
}

