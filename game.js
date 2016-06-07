var time_remained; // to keep track of times
var is_paused; // to check if the timer is puased or not
var score;  //to keep the current score
var level;  // to keep the current level
var alert_window = document.getElementById("alert_wind");   // pause_alert_window
var timer_control;

function start(){
  time_remained = 10; 
  score = 200;
  is_paused = 0;
  level = 1;
  document.getElementById("level").innerHTML = level;
  document.getElementById("score").innerHTML = score;
  
  document.getElementById("time_new_game").addEventListener("click",function(){
                                                                		document.getElementById("time_alert").style.visibility = "hidden";
																		clearTimeout(timer_control);
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
}

function show_time(){
  if( time_remained < 0 && is_paused == 0) {
    show_timeover_alert();  	
  }else{
    if( is_paused == 0 ){
	   document.getElementById("time").innerHTML=  time_remained;	  
	   time_remained = time_remained - 1; 
	}  
  }
   timer_control = setTimeout(show_time,1000);
}

function show_timeover_alert(){
     document.getElementById("time_alert").style.visibility="visible";
	 
}

window.onload = setTimeout(start,1000);

