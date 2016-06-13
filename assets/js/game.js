"use strict";

// Constants
const HOLE_WIDTH = 50;
const HOLE_HEIGHT = 50;
const HOLE_MARGIN = 100;
const HOLE_TYPE = [{name: "black", capacity: 1, points: 20, chance: 1/20},
					{name: "purple", capacity: 2, points: 10, chance: 1/10},
					{name: "blue", capacity: 3, points: 5, chance: 1/5}];
const GAME_WIDTH = $("#game").width();
const GAME_HEIGHT = $("#game").height();
const MAX_LEVELS = 2;

// Game Data
const holes = [];
const context = $("#game")[0].getContext("2d");
let time;
let paused;
let score;
let level;

// Animations
let timer_control;
let animate_control;
let rotate = 0;


/* TODO:
	- Start Screen:
		1. High scores should be saved and displayed (HTML5 Local Storage)
			(Title, High Score, Start button)
	
	- Levels:
		1. When time runs out, display a transitional screen

	- Black Holes:
		1. Should eat objects (within HOLE_MARGIN)
			- 50 points should subtract whenever it does
			- should disappear when type.capacity is reached
			- game over when score reaches 0
		2. Should be clickable and should disappear
		
	- Objects:
		1. 10 objects should randomly assort themselves (CANVAS)
			spacecraft, planets, asteroids, nebulae, stars
		2. Should move
			- bounces upon hitting the edge
		
*/

function initialize() {
	$("#time-new-game").on("click", function(){
		$("#time-alert").fadeOut(500);
		clearTimeout(timer_control);
		clearTimeout(animate_control);
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
	
	start();
}

function start() {
	time = 60; 
	paused = false;
	updateScore(200);
	updateLevel(1);
	
	showTime();
	animate();
}


function updateLevel(l) {
	level = l;
	$("#level").html(level);
}

function updateScore(s) {
	score = s;
	$("#score").html(score);
}

function reset(){
	holes.splice(0, holes.length);
	
	$("#timer").fadeIn(250); // reset animation
}

function showTime(){
	if (!paused) {
		if (time <= 0) {
			showTimeOver();  	
		} else {
			$("#time").html(time);	  
			time--; 
			HOLE_TYPE.forEach(function(type) {
				if (Math.random() < type.chance * level) {
					createHole(type);
				}
			});
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
			x_r = Math.floor(Math.random() * (GAME_WIDTH - HOLE_MARGIN)) + HOLE_WIDTH;
			y_r = Math.floor(Math.random() * (GAME_HEIGHT - (HOLE_MARGIN + HOLE_HEIGHT))) + (HOLE_HEIGHT * 2);
		} while (!checkOverlap(x_r, y_r));
		
		let holeObj = {type: holeType,
						opacity: 0,
						filled: 0,
						x: x_r,
						y: y_r};
		holeObj.img = new Image();
		holeObj.img.src = 'assets/images/' + holeObj.type.name + '-hole.svg'; 
		holes.push(holeObj);
    }  
}

function checkOverlap(x,y){
	var ret = true; // does not overlap
	holes.every(function(hole) {
		if (x >= hole.x - HOLE_MARGIN && x <= hole.x + HOLE_MARGIN && y >= hole.y - HOLE_MARGIN && y <= hole.y + HOLE_MARGIN) {
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
			context.globalAlpha = hole.opacity;
			context.translate(hole.x, hole.y);
			context.rotate(rotate * Math.PI / 180);
			
			context.drawImage(hole.img, -(HOLE_WIDTH / 2), -(HOLE_HEIGHT / 2), HOLE_WIDTH, HOLE_HEIGHT);
			context.restore();
			
			if (hole.opacity < 1) {
				hole.opacity += (1 / 30); // Fade In 30 frames
			}
        });
		
		if (time < 10) {
			$("#timer").fadeToggle(250);
		}
		
		rotate++;
    }
    animate_control = setTimeout(animate, 1000 / 60);
}

$(document).ready(function() {
	initialize();
});

