var time_remained; // to keep track of times
var timer_control;
var blackhole_control;
var is_paused; // to check if the timer is puased or not
var score;  //to keep the current score
var level;  // to keep the current level
var holes = [];
var context;

function start(){
  time_remained = 60; 
  score = 200;
  is_paused = 0;
  level = 1;
  document.getElementById("level").innerHTML = level;
  document.getElementById("score").innerHTML = score;
  context = document.getElementById("game").getContext("2d");
  document.getElementById("time_new_game").addEventListener("click",function(){
                                                                		document.getElementById("time_alert").style.visibility = "hidden";
																		clearTimeout(timer_control);
																		reset();
	             													    start();
														                });
  
  document.getElementById("pause").addEventListener("click",function(){
                                                                is_paused = 1 ;
        														document.getElementById("pause_alert").style.visibility = "visible";
		                                                        });
  																
  document.getElementById("resume").addEventListener("click",function(){
                                                                is_paused = 0 ;
        														document.getElementById("pause_alert").style.visibility = "hidden";
		                                                        });																
  show_time();
  animate();
}

function reset(){
  context.clearRect(0,0,document.getElementById("game").width,document.getElementById("game").height); 
  holes.splice(0,holes.length);
  
}

function show_time(){
  if( time_remained < 0 && is_paused == 0) {
    show_timeover_alert();  	
  }else{
    if( is_paused == 0 ){
	    document.getElementById("time").innerHTML=  time_remained;	  
	    time_remained = time_remained - 1; 
	   
	    if (level == 1 ){
	        if ( time_remained  > 0 &&(time_remained%4) == 0 ){
	             create_hole("blue");
            }
	        if ( time_remained  > 0 && (time_remained%7) == 0 ){
	             create_hole("purple");
            }
	        if ( time_remained  > 0 && (time_remained%15) == 0 ){
	             create_hole("black");
            }
		 }	
	 }  
  }
   timer_control = setTimeout(show_time,1000);
}

function show_timeover_alert(){
     document.getElementById("time_alert").style.visibility="visible";
}

function add_blackhole(holeObj){
   /*alert(holeObj); */
   var img = new Image();
   img.onload = function() {
           context.drawImage(img,holeObj.x-25,holeObj.y-25,50,50);
   };
   
   if ( holeObj.type == "black" ) {
      img.src = 'assets/images/black-hole.svg'; 
   }else if ( holeObj.type == "blue" ) {
      img.src = "assets/images/blue-hole.svg"; 
   }else if ( holeObj.type == "purple" ) {
      img.src = "assets/images/purple-hole.svg"; 
   }
   
 }
 
function create_hole(holeType){
    if( is_paused == 0 ){
	   var x_r = Math.floor(Math.random()*900)+50;
       var y_r = Math.floor(Math.random()*540)+50;
	   
	   while( checkOverlap(x_r-50,y_r-50) == 0 ){
          x_r = Math.floor(Math.random()*900)+50;
          y_r = Math.floor(Math.random()*540)+50;
	   }
	   var newhole = {type:holeType,cap:"3",x:x_r,y:y_r};
       holes.push(newhole);   
    }  
}

function checkOverlap(x,y){
   for( i = 0; i < holes.length; i++){
      if( ( x >= holes[i].x-50 && x <= holes[i].x+50 ) && ( y >= holes[i].y-50 && y <= holes[i].y+50 ) 
	                 || ( x+100 >= holes[i].x-50 && x+100 <= holes[i].x+50 ) && ( y >= holes[i].y-50 && y <= holes[i].y+50 )
					     || ( x >= holes[i].x-50 && x <= holes[i].x+50 ) && ( y+100 >= holes[i].y-50 && y+100 <= holes[i].y+50 )
						    || ( x+100 >= holes[i].x-50 && x+100 <= holes[i].x+50 ) && ( y+100 >= holes[i].y-50 && y+100 <= holes[i].y+50 ) ) {
	      return 0; // overlaps
	  } 
   } 
   return 1; // does not overlap
}

function animate(){
        if(is_paused == 0 ){
          for(j=0;j< holes.length;j++){ 
	         add_blackhole(holes[j]);
          }
        }
      setTimeout(animate,50);
}

window.onload = setTimeout(start,1000);

