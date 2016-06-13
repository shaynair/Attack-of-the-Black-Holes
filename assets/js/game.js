"use strict";

// Constants
const FPS = 60; // Frames per second
const HOLE_WIDTH = 50;
const HOLE_HEIGHT = 50;
const HOLE_MARGIN_WIDTH = 100; // Event Horizon width
const HOLE_MARGIN_HEIGHT = 100; // Event Horizon height
const HOLE_TYPE = [{name: "black", capacity: 1, points: 20, chance: 1/20},
					{name: "purple", capacity: 2, points: 10, chance: 1/10},
					{name: "blue", capacity: 3, points: 5, chance: 1/5}];
					// name = svg file name, chance = chance of spawning per second
const GAME_WIDTH = $("#game").width();
const GAME_HEIGHT = $("#game").height();		
const START_TIME = 60;
const START_SCORE = 200;
const MAX_LEVELS = 2;

// Game Data
const holes = [];
const canvas = $("#game")[0]; // convert jQuery object to DOM
const context = canvas.getContext("2d");
let time;
let paused;
let score;
let level;

// Animations
let timer_control;
let animate_control;
let rotate = 0; // Angle of rotating black holes


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
		2. Should be clickable (within 25px of x,y)
			- should disappear
			- should give points based off of type.points
		
	- Objects:
		1. 10 objects should randomly assort themselves (CANVAS)
			spacecraft, planets, asteroids, nebulae, stars, moons, space junk
		2. Should move, bounces upon hitting the edge
		3. Should be clickable and give points
		
*/

// Function to be called only once
function initialize() {
	// Since we style the canvas using CSS, this is necessary to scale the canvas
	canvas.setAttribute('width', '' + GAME_WIDTH);
	canvas.setAttribute('height', '' + GAME_HEIGHT);
	
	// Set all click events only once.
	$("#new-game").on("click", () => {
		$("#time-alert").fadeOut(300);
		restart();
	});
	  
	$("#pause").on("click", () => {
		paused = true;
		$("#pause-alert").fadeIn(300);
	});
																	
	$("#resume").on("click", () => {
		paused = false;
		$("#pause-alert").fadeOut(300);
	});		
	$("#instructions-open").on("click", () => {
		$("#instructions").slideToggle();
	});
	
	start();
}

// Function to be called whenever we start the game.
function start() {
	paused = false;
	updateScore(START_SCORE);
	updateLevel(1);
	
	setTimer();
	animate();
}


function updateLevel(l) {
	level = l;
	$("#level").html(level);
	
	time = START_TIME;
	$("#time").html(time);
}

function updateScore(s) {
	score = s;
	$("#score").html(score);
}

// Resets the current game and starts a new one.
function restart(){
	holes.splice(0, holes.length);
	clearTimeout(timer_control);
	clearTimeout(animate_control);
	$("#timer").fadeIn(200); // reset animation
	
	start();
}

// Executes every second. Creates new black holes.
function showTime(){
	if (!paused) {
		if (time <= 0) {
			$("#time-alert").fadeIn(300);	
		} else {
			time--; 
			$("#time").html(time);	  
			HOLE_TYPE.forEach((type) => {
				if (Math.random() < type.chance * level) {
					createHole(type);
				}
			});
		}
	}
	setTimer();
}

function setTimer() {
	timer_control = setTimeout(showTime, 1000);
}

// Creates a new black hole at a random location
function createHole(type){
	let x;
	let y;
	   
	do {
		x = Math.floor(Math.random() * (GAME_WIDTH - HOLE_MARGIN_WIDTH)) + HOLE_WIDTH;
		y = Math.floor(Math.random() * (GAME_HEIGHT - (HOLE_MARGIN_HEIGHT + HOLE_HEIGHT))) + (HOLE_HEIGHT * 2);
	} while (getOverlap(x, y) != null);
		
	let holeObj = {type, opacity: 0, filled: 0, x, y};
	holeObj.img = new Image();
	holeObj.img.src = 'assets/images/' + holeObj.type.name + '-hole.svg'; 
	holes.push(holeObj);
}

// Checks if this (x,y) overlaps with some black hole's event horizon.
function getOverlap(x,y){
	var ret = null;
	holes.every((hole) => {
		if (x >= hole.x - HOLE_MARGIN_WIDTH && x <= hole.x + HOLE_MARGIN_WIDTH 
				&& y >= hole.y - HOLE_MARGIN_HEIGHT && y <= hole.y + HOLE_MARGIN_HEIGHT) {
			ret = hole; // overlaps; we return the hole that overlapped
		} 
		return ret; // break if overlap
	});
	return ret;
}

function animate(){
    if(!paused && time > 0){
		context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); 
		
		holes.forEach((hole) => {
			context.save();
			context.globalAlpha = hole.opacity;
			context.translate(hole.x, hole.y);
			context.rotate(rotate * Math.PI / 180);
			
			context.drawImage(hole.img, -(HOLE_WIDTH / 2), -(HOLE_HEIGHT / 2), HOLE_WIDTH, HOLE_HEIGHT);
			context.restore();
			
			if (hole.opacity < 1) {
				hole.opacity += (2 / FPS); // Fade In 0.5 sec
			}
        });
		
		if (time < 10) {
			$("#timer").fadeToggle(200);
		}
		
		rotate++;
    }
    animate_control = setTimeout(animate, 1000 / FPS);
}

class SpaceObject {
	constructor (x, y) {
		this.x = x;
		this.y = y;
	}
	
	get x () { return this.x; }
	get y () { return this.y; }
	
	draw () {
	}
}

class SpaceJunk extends SpaceObject {
}


$(document).ready(() => {
	initialize();
});

