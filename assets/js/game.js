"use strict";

// Constants
const FPS = 60; // Frames per second
const OBJ_WIDTH = 50;
const OBJ_HEIGHT = 50;
const HOLE_MARGIN_WIDTH = 50; // Event Horizon half width
const HOLE_MARGIN_HEIGHT = 50; // Event Horizon half height
const HOLE_CLICK_WIDTH = 25; // Click Horizon width
const HOLE_CLICK_HEIGHT = 25; // Click Horizon height
const HOLE_AREA_WIDTH = 5; // Point of No Return width
const HOLE_AREA_HEIGHT = 5; // Point of No Return height
const HOLE_TYPE = [{name: "black", capacity: 1, points: 20, chance: 1/20},
					{name: "purple", capacity: 2, points: 10, chance: 1/10},
					{name: "blue", capacity: 3, points: 5, chance: 1/5}];
					// name = svg file name, chance = chance of spawning per second
const GAME_WIDTH = $("#game").width();
const GAME_HEIGHT = $("#game").height();		
const START_TIME = 60;
const SCORE_LOSS = 50;
const START_SCORE = 200;
const MAX_LEVELS = 2;
const NUM_OBJECTS = 10;

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

	- Objects:
		1. 10 objects should randomly assort themselves (CANVAS)
			spacecraft, planets, asteroids, nebulae, stars, 
			moons, space junk, UFO, rockets, satellites
		2. Should move, bounces upon hitting the edge
		3. Should get eaten by black holes		
*/

// Function to be called only once
function initialize() {
	// Since we style the canvas using CSS, this is necessary to scale the canvas
	canvas.setAttribute('width', '' + GAME_WIDTH);
	canvas.setAttribute('height', '' + GAME_HEIGHT);
	
	// Set all click events only once.
	$("#new-game").on("click", () => {
		$("#gameover-alert").fadeOut(300);
		restart();
		// --------------------------TODO---------------------------------
		// Play a sound here.
	});
	  
	$("#pause").on("click", () => {
		pause();
		// --------------------------TODO---------------------------------
		// Play a sound here.
	});
																	
	$("#resume").on("click", () => {
		unpause();
		// --------------------------TODO---------------------------------
		// Play a sound here.
	});
	
	$("#instructions-open").on("click", () => {
		$("#instructions").slideToggle();
	});
	
	// Main click handler.
	$("#game").on("click", (e) => {
		if (!isRunning()) {
			return;
		}
		let x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - $canvas.offset().left;
		let y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - $canvas.offset().top;
		
		let hole = getOverlap(x, y, HOLE_CLICK_WIDTH, HOLE_CLICK_HEIGHT);
		if (hole !== null) {
			// Remove the hole and give points
			hole.alive = false;
			addScore(hole.type.points);
			// --------------------------TODO---------------------------------
			// Play a sound here.
		}
	});
	
	start();
}

function isRunning() {
	return !paused && time > 0 && score > 0;
}

function pause() {
	paused = true;
	$("#pause-alert").fadeIn(300);
}

function unpause() {
	paused = false;
	$("#pause-alert").fadeOut(300);
}

// Function to be called whenever we start the game.
function start() {
	unpause();
	updateScore(START_SCORE);
	updateTime(START_TIME);
	updateLevel(1);
	
	for (let i = 0; i < NUM_OBJECTS; i++) {
		createObject();
	}
	
	setTimer();
	animate();
}


function updateLevel(l) {
	level = l;
	$("#level").html(level);
}

function updateTime(t) {
	time = Math.max(0, t);
	$("#time").html(time);
}

function updateScore(s) {
	score = Math.max(0, s);
	$("#score").html(score);
}

function addScore(s) {
	updateScore(score + s);
	
	let $change = $("#score-change");
	$change.text((s > 0 ? "+" : "") + s);
	fadeInline($change, 100, 1000);
	
	if (score <= 0) {
		unpause();
		$("#gameover-alert").fadeIn(300);
	}
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
	if (time <= 0 && score > 0 && !paused) {
		// TODO make new level
	} else if (isRunning()) {
		updateTime(time - 1);
		HOLE_TYPE.forEach((type) => {
			if (Math.random() < type.chance * level) {
				createHole(type);
			}
		});
	}
	setTimer();
}

function setTimer() {
	timer_control = setTimeout(showTime, 1000);
}

// Creates a new object (non-black hole) at a random location
function createObject() {
	let x;
	let y;
	   
	do {
		x = Math.random() * (GAME_WIDTH - OBJ_WIDTH) + OBJ_WIDTH;
		y = Math.random() * (GAME_HEIGHT - OBJ_HEIGHT) + OBJ_HEIGHT;
	} while (getOverlap(x, y) !== null); // check if overlaps with some black hole's event horizon
		
	let moment = Math.random() * 360; // degrees of angular momentum per second
	let velocity = Math.random() * (GAME_WIDTH + GAME_HEIGHT) / (OBJ_WIDTH + OBJ_HEIGHT); // units of movement per second
	let angle = Math.random() * 2 * Math.PI; // direction of movement
	
	objects.push(new SpaceJunk(x, y, moment, velocity, angle));
}

// Creates a new black hole at a random location
function createHole(type) {
	let x;
	let y;
	   
	do {
		x = Math.random() * (GAME_WIDTH - (2 * HOLE_MARGIN_WIDTH)) + HOLE_MARGIN_WIDTH;
		y = Math.random() * (GAME_HEIGHT - (2 * HOLE_MARGIN_HEIGHT)) + HOLE_MARGIN_HEIGHT;
	} while (getOverlap(x, y) !== null); // check if overlaps with some black hole's event horizon
		
	objects.push(new BlackHole(x, y, type));
}

// Checks if this (x,y) overlaps with some rectangle.
function getOverlap(x, y, margin_x = HOLE_MARGIN_WIDTH * 2, margin_y = HOLE_MARGIN_HEIGHT * 2) {
	var ret = null;
	objects.every((hole) => {
		if (hole.isBlackHole() && hole.alive && hole.intersects(x, y, margin_x, margin_y)) {
			ret = hole; // overlaps; we return the hole that overlapped
		} 
		return ret === null; // break if overlap
	});
	return ret;
}

function animate(){
    if(isRunning()) {
		context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); 
		
		objects.forEach((obj, index) => {
			obj.draw(context);
			
			if (!obj.alive && obj.opacity <= 0) {
				objects.splice(index, 1);
			} else if (!obj.isBlackHole()) {
				if (obj.attractor !== null && !obj.attractor.alive) {
					obj.attractor = null;
				}
				// Find and set an attractive black hole
				if (obj.attractor === null) {
					let hole = getOverlap(obj.x, obj.y); // n^2...
					if (hole !== null) {
						obj.attractor = hole;
					}
				}
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

//-------------------------------------------------------------------------------
class SpaceObject {
	constructor (x, y, moment = 0, velocity = 0, angle = 0) {
		this.x = x;
		this.y = y;
		this.opacity = 0;
		this.alive = true;
		this.angle = angle; // 2D angle
		this.velocity = velocity; // movement per second
		this.moment = moment; // angular momentum, degrees per second
		this.rotate = 0;
		this.attractor = null; // black hole that we are attracted to
	}
	
	isBlackHole() { return false; }
	
	intersects(x, y, margin_x, margin_y) {
		return x >= this.x - margin_x 
				&& x <= this.x + margin_x && y >= this.y - margin_y && y <= this.y + margin_y;
	}
	
	// To be overridden
	innerDraw (context) { }
	
	draw (context) {
		context.save();
		context.globalAlpha = this.opacity;
		context.translate(this.x, this.y);
		
		context.rotate(this.rotate * Math.PI / 180);
		this.rotate = (this.rotate + (this.moment / FPS)) % 360;
		
		this.innerDraw(context);
		
		context.restore();
		if (this.alive) {
			if (this.attractor !== null) {
				// Go towards the black hole
				let dist = Math.sqrt(Math.pow(this.x - this.attractor.x, 2) + Math.pow(this.y - this.attractor.y, 2));
				this.x += ((this.attractor.x - this.x) / dist);
				this.y += ((this.attractor.y - this.y) / dist);
				if (this.attractor.intersects(this.x, this.y, HOLE_AREA_WIDTH, HOLE_AREA_HEIGHT)) { 
					// Absorbed
					this.alive = false;
					
					this.attractor.filled++;
					if (this.attractor.filled >= this.attractor.type.capacity) {
						this.attractor.alive = false; // Full
					}
					this.attractor = null;
					addScore(-SCORE_LOSS);
				}
			} else if (this.velocity !== 0) {
				this.x += (this.velocity / FPS) * Math.cos(this.angle);
				this.y += (this.velocity / FPS) * Math.sin(this.angle);
				
				if (this.x <= (OBJ_WIDTH / 2)) {
					this.x = (OBJ_WIDTH / 2);
					// Hits left side; change angle to right
					this.angle = Math.PI - this.angle;
				} else if (this.x >= GAME_WIDTH - (OBJ_WIDTH / 2)) {
					this.x = GAME_WIDTH - (OBJ_WIDTH / 2);
					// Hits right side; change angle to left
					this.angle = Math.PI - this.angle;
				}
				if (this.y <= (OBJ_HEIGHT / 2)) {
					this.y = (OBJ_HEIGHT / 2);
					// Hits top side; change angle to down
					this.angle = 2 * Math.PI - this.angle;
				} else if (this.y >= GAME_HEIGHT - (OBJ_HEIGHT / 2)) {
					this.y = GAME_HEIGHT - (OBJ_HEIGHT / 2);
					// Hits bottom side; change angle to up
					this.angle = 2 * Math.PI - this.angle;
				}
			}
		}
		if (this.alive && this.opacity < 1) {
			this.opacity += (2 / FPS); // Fade In 0.5 sec
		} else if (!this.alive && this.opacity > 0) {
			this.opacity -= (2 / FPS); // Fade Out 0.5 sec
		}
	}
}

class BlackHole extends SpaceObject {
	
	constructor (x, y, type) {
		super(x, y, 60 * type.capacity);
		this.filled = 0;
		this.type = type;
		
		this.img = new Image();
		this.img.src = 'assets/images/' + type.name + '-hole.svg'; 
	}
	
	isBlackHole() { return true; }
	
	innerDraw (context) {
		context.drawImage(this.img, -(OBJ_WIDTH / 2), -(OBJ_HEIGHT / 2), OBJ_WIDTH, OBJ_HEIGHT);
	}
}

class SpaceJunk extends SpaceObject {
}


$(document).ready(() => {
	initialize();
});

