var canvas, gl, program; 
var points = [];
var colors = [];
var textures = [];
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 0),
    vec2(1, 1)
]
var color_patterns = [
    vec4(1.0, 0.0, 0.0, 1.0),
    vec4(0.0, 1.0, 0.0, 1.0),
    vec4(0.0, 0.0, 1.0, 1.0),
    vec4(1.5, 1.0, 0.2, 1.0)
];
var camera_x = 1.0;
var camera_y = 1.0;
var camera_z = 1.0;
var theta = 30.0;
var modelViewMatrix, modelViewMatrixLoc; 
var projectionMatrix, projectionMatrixLoc;
var transformedMatrix, transformedMatrixLoc;
var texture;
function requestCORSIfNotSameOrigin(img, url) {
    if ((new URL(url, window.location.href)).origin !== window.location.origin) {
      img.crossOrigin = "anonymous";
    }
  }
var url = "https://github.com/dragonfly9113/interactive_computer_graphics_7th/blob/master/Chap7/SA2011_black.gif?raw=true";
function configureTexture(image){
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 255, 255]));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    var textureInfo = {
        width: 1,   // we don't know the size until it loads
        height: 1,
        texture: texture,
      };

      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;
  
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      });
      requestCORSIfNotSameOrigin(img, url);
      img.src = url;

    gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);


}
window.onload = function main(){
    // canvas and gl initialization 
    canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL(canvas);
    if(! gl) {alert("Browser doesnt support!")};

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(1, 1, 1, 1);
    gl.enable(gl.DEPTH_TEST); // Enable depth test

    program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    if(! program) {alert("Program failed")};
    gl.useProgram(program);

    // Set geometry 
    setTetheadron(
        vec4(-0.5, 0, -0.5, 1.0),
        vec4(0.5, 0, -0.5, 1.0),
        vec4(0.0, 0.5, 0.0, 1.0),
        vec4(0.0, -0.5, 0.25, 1.0)
    );

    // Position buffer
    var posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'vPosition'), 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'vPosition'));

    // Color buffer
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'vColor'), 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'vColor'));

    // var image = document.getElementById("texImage");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = 'SA2011_black.gif';
    img.width = 224;
    img.height = 224;
    configureTexture(img);

    var texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textures), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'vTexCoord'), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'vTexCoord'));
    // Uniform location setup 
    modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
    projectionMatrixLoc = gl.getUniformLocation(program, 'projectionMatrix');
    transformedMatrixLoc = gl.getUniformLocation(program, 'transformedMatrix');

    render(); 
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    theta += 1.0;

    modelViewMatrix = lookAt([camera_x, camera_y, camera_z], [0, 0, 0], [0, 1, 0]);
    projectionMatrix = perspective(45, canvas.width / canvas.height, 0.2, 100);
    transformedMatrix =  rotate(theta, [0, 1, 1]);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(transformedMatrixLoc, false, flatten(transformedMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, points.length);
    requestAnimationFrame(render);
}

function setTetheadron(a, b, c, d){
    triangle(a, b, c, 0); 
    triangle(a, b, d, 1);
    triangle(b, c, d, 2);
    triangle(a, c, d, 3);
}

function triangle(a, b, c, i){
    points.push(a, b, c);
    colors.push(color_patterns[i], color_patterns[i], color_patterns[i]);
    textures.push(texCoord[0], texCoord[1], texCoord[2]);
}   
