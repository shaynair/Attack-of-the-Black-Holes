var time_remained; // to keep track of times
var is_paused; // to check if the timer is puased or not
var score;  //to keep the current score
var level;  // to keep the current level
var alert_window;   // pause_alert_window

function start(){
  time_remained = 60; 
  score = 200;
  is_paused = 0;
  level 1;
  show_time();
  alert_window = document.getElementById("alert_wind");
}

function show_time(){
  if( time_remainded == 0 ) {
    show_timeover_alert();  
  }else{
    time_remainded = time_remainded-1; 
	document.getElementById("time").innerHTML="";
	document.getElementById("time").innerHTML= time_remainder;
	setTimeout(show_time,1000);
  }
}

function show_timeover_alert(){
    var alert_wind = document.createElement("section");
    alert_wind.style.width = "100px";
    alert_wind.style.height = "300px";
    alert_wind.style.marginLeft = "auto";
    alert_wind.style.marginRight = "auto";
    alert_wind.style.marginRight = "auto";
  
}


window.onload = start;

