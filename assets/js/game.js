"use strict";

const HOLE_WIDTH = 50;
const HOLE_HEIGHT = 50;
const HOLE_MARGIN = 1.5; // Scale factor relative to width/height
const GAME_WIDTH = $("#game").width();
const GAME_HEIGHT = $("#game").height();

let time; // to keep track of times
let timer_control;
let paused = false; // to check if the timer is puased or not
let score;  //to keep the current score
let level;  // to keep the current level
const holes = [];
const context = $("#game")[0].getContext("2d");

// Animations
let rotate = 0;

function start(){
	time = 60; 
	score = 200;
	paused = 0;
	level = 1;
	$("#level").html(level);
	$("#score").html(score);
	
	$("#time-new-game").on("click", function(){
		$("#time-alert").fadeOut(500);
		clearTimeout(timer_control);
		reset();
		start();
	});
	  
	$("#pause").on("click", function() {
		paused = true;
		$("#pause-alert").fadeIn(500);
	});
																	
	$("#resume").on("click", function() {
		paused = false;
		$("#pause-alert").fadeOut(500);
	});														
	showTime();
	animate();
}

function reset(){
	holes.splice(0, holes.length);
	
	$("#timer").fadeIn(250); // reset animation
}

function showTime(){
	if (!paused) {
		if (time < 0) {
			showTimeOver();  	
		} else {
			$("#time").html(time);	  
			time--; 
			if (level == 1 && time > 0) {
				if ((time % 4) == 0) {
					createHole("blue");
				}
				if ((time % 7) == 0) {
					createHole("purple");
				}
				if ((time % 15) == 0) {
					createHole("black");
				}
			}
		}
	}
	timer_control = setTimeout(showTime, 1000);
}

function showTimeOver(){
    $("#time-alert").fadeIn(500);
}
 
function createHole(holeType){
    if (!paused) {
		let x_r;
		let y_r;
	   
		do {
			x_r = Math.floor(Math.random() * (GAME_WIDTH - (HOLE_MARGIN * HOLE_WIDTH))) + HOLE_WIDTH;
			y_r = Math.floor(Math.random() * (GAME_HEIGHT - ((HOLE_MARGIN + 1) * HOLE_HEIGHT))) + (HOLE_HEIGHT * 2);
		} while (!checkOverlap(x_r, y_r));
		
		let holeObj = {type: holeType,
						x: x_r,
						y: y_r};
		holeObj.img = new Image();
		holeObj.img.src = 'assets/images/' + holeObj.type + '-hole.svg'; 
		holes.push(holeObj);
    }  
}

function checkOverlap(x,y){
	var ret = true; // does not overlap
	holes.every(function(hole) {
		if (x >= hole.x - (HOLE_WIDTH * HOLE_MARGIN) && x <= hole.x + (HOLE_WIDTH * HOLE_MARGIN) 
					&& y >= hole.y - (HOLE_HEIGHT * HOLE_MARGIN) && y <= hole.y + (HOLE_HEIGHT * HOLE_MARGIN)) {
			ret = false; // overlaps
		} 
		return ret; // break if overlap
	});
	return ret;
}

function animate(){
    if(!paused && time > 0){
		context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); 
		
		holes.forEach(function(hole) {
			context.save();
			context.translate(hole.x, hole.y);
			context.rotate(rotate * Math.PI / 180);
			
			context.drawImage(hole.img, -(HOLE_WIDTH / 2), -(HOLE_HEIGHT / 2), HOLE_WIDTH, HOLE_HEIGHT);
			context.restore();
        });
		
		if (time < 10) {
			$("#timer").fadeToggle(250);
		}
		
		rotate++;
    }
    setTimeout(animate, 1000 / 60);
}

$(document).ready(function() {
	start();
});

