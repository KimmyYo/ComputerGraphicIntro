var gl;
var points = [];
var vertices = [
    vec3(  0.0000,  0.0000, -1.0000 ),        
    vec3(  0.0000,  0.9428,  0.3333 ),        
    vec3( -0.8165, -0.4714,  0.3333 ),        
    vec3(  0.8165, -0.4714,  0.3333 )    
  ];
  

window.onload = function main(){
    // Get canvas
    var canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl){alert("WebGL isn't available")};
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Get Program 
    var program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);

    // Get Attribute Locations 
    var vPosition = gl.getAttribLocation(program, 'a_position');
    var vColor = gl.getAttribLocation(program, 'a_color');

    gl.enable(gl.DEPTH_TEST);
    
    // Position enable 
    gl.enableVertexAttribArray(vPosition);
    // Postion Buffer set uip 
    var positionBuffer = gl.createBuffer();
    // Bind Buffer 
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Set Buffer data 
    setGeometry(gl);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    // Color enable 
    gl.enableVertexAttribArray(vColor);
    // Color Buffer 
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    setColors(gl);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

    console.log(points);
   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    render();


}
function render(){
    // Draw 
    var offset = 0;
    var type = gl.TRIANGLES;
    gl.drawArrays(type, offset, points.length);
}
function triangles(a, b, c){ // single triangle vertices
    points.push(a, b, c);
}
function divideTriangles(a, b, c, count){
    if(count === 0) triangles(a, b, c);
    else{
        // mean to get new inner points 
        var ab_mean = mix(a, b, 0.5);
        var ac_mean = mix(a, c, 0.5);
        var bc_mean = mix(b, c, 0.5);
        --count;

        // three new triangles 
        divideTriangles(a, ab_mean, ac_mean, count);
        divideTriangles(c, ac_mean, bc_mean, count);
        divideTriangles(b, bc_mean, ab_mean, count);
        
    }
}
function setGeometry(gl){
    var count = 5;
    
    divideTriangles(vertices[0], vertices[1], vertices[2], count);
    
    divideTriangles(vertices[0], vertices[1], vertices[3], count);
    divideTriangles(vertices[0], vertices[2], vertices[3], count);
    // divideTriangles(vertices[1], vertices[2], vertices[3], count);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        flatten(points),
        gl.STATIC_DRAW
    )
} 
function setColors(gl){
    var colors = [];
    var point_idx = 0;
    var left = vec4(0.0, 0.0, 1.0, 1.0);
    var bottom = vec4(0.0, 0.0, 0.8, 1.0);
    var right = vec4(0.8, 0.8, 0.8, 1.0);
    var color_pattern = [left, bottom, right];
     // Give each face a random color 
    for(let i = 0; i < 3; i++){
        let push_color = color_pattern[i];
        for(let j = point_idx; j < point_idx + points.length / 3; j++){
            colors.push(
                push_color
            )
        }
        point_idx += points.length / 3 ;
    }
   
    gl.bufferData(
        gl.ARRAY_BUFFER,
        flatten(colors),
        gl.STATIC_DRAW
    )
}