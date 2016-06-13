"use strict";

// Constants
const FPS = 60; // Frames per second
const OBJ_WIDTH = 50;
const OBJ_HEIGHT = 50;
const HOLE_MARGIN_WIDTH = 50; // Event Horizon half width
const HOLE_MARGIN_HEIGHT = 50; // Event Horizon half height
const HOLE_CLICK_WIDTH = 25; // Click Horizon width
const HOLE_CLICK_HEIGHT = 25; // Click Horizon height
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
const objects = [];
const $canvas = $("#game");
const canvas = $canvas[0]; // convert jQuery object to DOM
const context = canvas.getContext("2d");
let time;
let paused;
let score;
let level;
let ticks = 0;

// Animations
let timer_control;
let animate_control;


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

	- Objects:
		1. 10 objects should randomly assort themselves (CANVAS)
			spacecraft, planets, asteroids, nebulae, stars, 
			moons, space junk, UFO
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
	
	// Main click handler.
	$("#game").on("click", (e) => {
		if (paused || time <= 0) {
			return;
		}
		let x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - $canvas.offset().left;
		let y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - $canvas.offset().top;
		
		let hole = getOverlap(x, y, HOLE_CLICK_WIDTH, HOLE_CLICK_HEIGHT);
		if (hole != null) {
			// Remove the hole and give points
			hole.alive = false;
			updateScore(score + hole.type.points);
			
			let $change = $("#score-change");
			$change.text("+" + hole.type.points);
			fadeInline($change, 100, 2000);
			// --------------------------TODO---------------------------------
			// Play a sound or animation here.
		}
	});
	
	start();
}

// Function to be called whenever we start the game.
function start() {
	paused = false;
	updateScore(START_SCORE);
	updateTime(START_TIME);
	updateLevel(1);
	
	setTimer();
	animate();
}


function updateLevel(l) {
	level = l;
	$("#level").html(level);
}

function updateTime(t) {
	time = t;
	$("#time").html(time);
}

function updateScore(s) {
	score = s;
	$("#score").html(score);
}

// Keeps an inline object in space calculations for fading.
function fadeInline($object, inTime, outTime, inFirst = true) {
	$object.stop();
	if (inFirst) {
		$object.fadeIn(inTime, () => {
			$object.css("visibility", "visible")
					.css("display", "inline-block")
					.fadeOut(outTime, () => {
						$object.css("display", "inline-block")
								.css("visibility", "hidden");
					});
			});
	} else {
		$object.fadeOut(inTime, () => {
			$object.css("visibility", "hidden")
					.css("display", "inline-block")
					.fadeIn(outTime, () => {
						$object.css("display", "inline-block")
								.css("visibility", "visible");
					});
		});
	}
}

// Resets the current game and starts a new one.
function restart(){
	objects.splice(0, objects.length);
	clearTimeout(timer_control);
	clearTimeout(animate_control);
	
	start();
}

// Executes every second. Creates new black holes.
function showTime() {
	if (!paused) {
		if (time <= 0) {
			$("#time-alert").fadeIn(300);	
		} else {
			updateTime(time - 1);
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
function createHole(type) {
	let x;
	let y;
	   
	do {
		x = Math.floor(Math.random() * (GAME_WIDTH - (2 * HOLE_MARGIN_WIDTH))) + HOLE_MARGIN_WIDTH;
		y = Math.floor(Math.random() * (GAME_HEIGHT - (2 * HOLE_MARGIN_HEIGHT))) + HOLE_MARGIN_HEIGHT;
	} while (getOverlap(x, y) != null); // check if overlaps with some black hole's event horizon
		
	objects.push(new BlackHole(x, y, type));
}

// Checks if this (x,y) overlaps with some rectangle.
function getOverlap(x, y, margin_x = HOLE_MARGIN_WIDTH * 2, margin_y = HOLE_MARGIN_HEIGHT * 2) {
	var ret = null;
	objects.every((hole) => {
		if (hole.isBlackHole() && hole.alive && x >= hole.x - margin_x 
				&& x <= hole.x + margin_x && y >= hole.y - margin_y && y <= hole.y + margin_y) {
			ret = hole; // overlaps; we return the hole that overlapped
		} 
		return ret == null; // break if overlap
	});
	return ret;
}

function animate(){
    if(!paused && time > 0) {
		context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); 
		
		objects.forEach((obj, index) => {
			obj.draw(context);
			
			if (!obj.alive && obj.opacity <= 0) {
				objects.splice(index, 1);
			}
        });
		
		// Flicker time when low
		if (time < 10 && (ticks % (FPS / 3)) == 0) {
			fadeInline($("#timer"), 160, 160, false);
		}
    }
	ticks++;
    animate_control = setTimeout(animate, 1000 / FPS);
}

class SpaceObject {
	constructor (x, y, rotate = 0, velocity = 0, angle = 0) {
		this.x = x;
		this.y = y;
		this.opacity = 0;
		this.alive = true;
		this.angle = angle; // 2D angle
		this.velocity = velocity;
		this.rotate = rotate; // angular momentum
	}
	
	isBlackHole() { return false; }
	
	// To be overridden
	innerDraw (context) { }
	
	draw (context) {
		context.save();
		context.globalAlpha = this.opacity;
		context.translate(this.x, this.y);
		
		context.rotate(this.angle * Math.PI / 180);
		
		this.innerDraw(context);
		
		context.restore();
		
		if (this.alive && this.opacity < 1) {
			this.opacity += (2 / FPS); // Fade In 0.5 sec
		} else if (!this.alive && this.opacity > 0) {
			this.opacity -= (2 / FPS); // Fade Out 0.5 sec
		}
	}
}

class BlackHole extends SpaceObject {
	
	constructor (x, y, type) {
		super(x, y);
		this.filled = 0;
		this.type = type;
		
		this.img = new Image();
		this.img.src = 'assets/images/' + type.name + '-hole.svg'; 
	}
	
	isBlackHole() { return true; }
	
	innerDraw (context) {
		context.drawImage(this.img, -(OBJ_WIDTH / 2), -(OBJ_HEIGHT / 2), OBJ_WIDTH, OBJ_HEIGHT);
		
		this.angle = (this.angle + 1) % 180;
	}
}

class SpaceJunk extends SpaceObject {
}


$(document).ready(() => {
	initialize();
});

