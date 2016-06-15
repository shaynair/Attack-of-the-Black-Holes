"use strict";

// Constants
const FPS = 60; // Frames per second
const OBJ_WIDTH = 50;
const OBJ_HEIGHT = 50;
const HOLE_MARGIN_WIDTH = 50; // Event Horizon half width
const HOLE_MARGIN_HEIGHT = 50; // Event Horizon half height
const HOLE_CLICK_WIDTH = 25; // Click Horizon width
const HOLE_CLICK_HEIGHT = 25; // Click Horizon height
const HOLE_AREA_WIDTH = 0.5; // Point of No Return half width
const HOLE_AREA_HEIGHT = 0.5; // Point of No Return half height
const HOLE_TYPE = [{name: "black", capacity: 1, points: 20, chance: 1/20},
					{name: "purple", capacity: 2, points: 10, chance: 1/10},
					{name: "blue", capacity: 3, points: 5, chance: 1/5}];
					// name = svg file name, chance = chance of spawning per second
const GAME_WIDTH = $("#game").width();
const GAME_HEIGHT = $("#game").height();		
const START_TIME = 60;
const SCORE_LOSS = 50;
const START_SCORE = 200;
const MAX_LEVEL = 2;
const NUM_OBJECTS = 10;
const MAX_SCORE_DISPLAY = 3;

// Game Data
let objects = [];
let holes = [];
const $canvas = $("#game");
const canvas = $canvas[0]; // convert jQuery object to DOM
const ctx = canvas.getContext("2d");
let time;
let paused;
let score;
let level;
let ticks = 0;
let numScores = 0;
let timerControl;
let animateControl;


/* TODO:
	- Objects:
		1. 10 objects should randomly assort themselves (CANVAS)
			planets, asteroids, nebulae, stars, moons, space junk, UFO
*/

// Function to be called only once
function initialize() {
	// Since we style the canvas using CSS, this is necessary to scale the canvas
	canvas.setAttribute('width', '' + GAME_WIDTH);
	canvas.setAttribute('height', '' + GAME_HEIGHT);
	
	// HACK: we don't want to dynamically resize, so change to flex first
	$(".alert-full").css("display", "flex").fadeOut(0);
	
	// Set all click events only once.
	$("#new-game").on("click", () => {
	    $("#gameover").fadeOut();
		restart();
	});
	  
	$("#pause").on("click", () => {
		if (!isRunning()) {
			return;
		}
		pause();
	});
																	
	$("#resume").on("click", unpause);
	
	$("#start").on("click", () => {
	    $("#start-page").fadeOut();
		start();
	});
	
	$("#next").on("click", () => {
		$("#change-level").fadeOut();
		start();
	});

	$("#finish").on("click", () => {
	   $("#finish-level").fadeOut();
	   restart();
	});
	
	$("#instructions-open").on("click", () => {
		$("#instructions").slideToggle();
	});
	
	// Main click handler.
	$("#game").on("click", (e) => {
		if (!isRunning()) {
			return;
		}
		// Find where they clicked
		let x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - $canvas.offset().left;
		let y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - $canvas.offset().top;
		
		let hole = getOverlap(x, y, HOLE_CLICK_WIDTH, HOLE_CLICK_HEIGHT);
		if (hole !== null) {
			// Remove the hole and give points
			hole.alive = false;
			addScore(hole.type.points);
		}
	});
	
	// show the start page. 
	restart(true);
}

// Loads scores from localStorage and displays it on the start screen.
function getScores() {
	let stored = localStorage.getItem("0"); // Number of scores
	let scoresList = [];
	let $scores = $("#high-scores").empty();
	if (stored === null || parseInt(stored) <= 0){
		$scores.append($('<li/>').html("0"));
	} else {
		numScores = parseInt(stored);
		for (let i = 1; i <= numScores; i++){
			scoresList.push(parseInt(localStorage.getItem(i.toString())));
		}

		// Sort in Descending order
		scoresList.sort((a,b) => { return b-a; });
	  
	    // Get only the first elements and display them
		scoresList.slice(0, Math.min(MAX_SCORE_DISPLAY, numScores)).forEach((score) => {
			$scores.append($('<li/>').html(score));
		});
    }  
}

// Stores a score into localStorage
function storeScore(num){
	numScores++;
	localStorage.setItem(numScores.toString(),num.toString());
	localStorage.setItem("0",numScores.toString());
}

// If gameplay is on
function isRunning() {
	return !paused && time > 0 && objects.length > 0;
}

function pause() {
	paused = true;
	$("#pause-alert").fadeIn();
}

function unpause() {
	paused = false;
	$("#pause-alert").fadeOut();
}

// Function to be called whenever we start the game.
function start() {
	reset();

	updateTime(START_TIME);
	updateLevel(level + 1);
	
	for (let i = 0; i < NUM_OBJECTS; i++) {
		createObject();
	}
	
	setTimer();
	animate();
}

// Resets game data
function reset() {
	objects.splice(0, objects.length);
	holes.splice(0, holes.length);
	clearTimeout(timerControl);
	clearTimeout(animateControl);
	unpause();
	
	updateTime(0);
	
}

// Resets the current game and starts a new one.
function restart(firstTime = false){
	if (!firstTime) {
		storeScore(score);
	}
	
	reset();
	updateScore(START_SCORE);
	updateLevel(0);

	getScores();
	fadeInBox($("#start-page"), firstTime ? 0 : 400);
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
	score = s;
	$("#score").html(score);
}

// Displays a change in score
function addScore(s) {
	updateScore(score + s);
	
	let $change = $("#score-change");
	$change.text((s > 0 ? "+" : "") + s);
	fadeInline($change, 100, 2000);
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

// Ensures flexbox design
function fadeInBox($object, inTime = 300) {
	$object.fadeIn(inTime, () => {
		$object.css("display", "flex");
	});
}

// Executes every second. Creates new black holes.
function showTime() {
    if (time <= 0 && objects.length > 0 && !paused) {
		// Level finished
		if (level < MAX_LEVEL) {
			$("#current-score").html(score);
			$("#new-level").html(level + 1);
			fadeInBox($("#change-level"));
		} else {
			$("#final-score").html(score);
			fadeInBox($("#finish-level"));
		}
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
	timerControl = setTimeout(showTime, 1000);
}

// Creates a new object (non-black hole) at a random location
function createObject() {
	let x = Math.random() * (GAME_WIDTH - OBJ_WIDTH) + OBJ_WIDTH;
	let y = Math.random() * (GAME_HEIGHT - OBJ_HEIGHT) + OBJ_HEIGHT;

	let moment = Math.random() * 360; // degrees of angular momentum per second
	let velocity = (Math.random() * ((GAME_WIDTH + GAME_HEIGHT) / 5 - 10)) + 10; // units of movement per second
	let angle = Math.random() * 2 * Math.PI; // direction of movement
	
	let type = Math.floor(Math.random() * 2);
	let obj;
	// random class
	switch(type) {
		case 0:
			obj = new Satellite(x, y, moment, velocity, angle);
			break;
		case 1:
			obj = new SpaceRocket(x, y, moment, velocity, angle);
			break;
	}
	
	objects.push(obj);
}

// Creates a new black hole at a random location
function createHole(type) {
	let x;
	let y;
	   
	do {
		x = Math.random() * (GAME_WIDTH - (2 * HOLE_MARGIN_WIDTH)) + HOLE_MARGIN_WIDTH;
		y = Math.random() * (GAME_HEIGHT - (2 * HOLE_MARGIN_HEIGHT)) + HOLE_MARGIN_HEIGHT;
	} while (getOverlap(x, y) !== null); // check if overlaps with some black hole's event horizon
		
	holes.push(new BlackHole(x, y, type));
}

// Checks if this (x,y) overlaps with some rectangle around some black hole.
function getOverlap(x, y, marginX = HOLE_MARGIN_WIDTH * 2, marginY = HOLE_MARGIN_HEIGHT * 2) {
	var ret = null;
	holes.every((hole) => {
		if (hole.alive && hole.intersects(x, y, marginX, marginY)) {
			ret = hole; // overlaps; we return the hole that overlapped
		} 
		return ret === null; // break if overlap
	});
	return ret;
}

function animate(){
    if(isRunning()) {
		ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); 
		
		objects = objects.filter((obj) => {
			obj.draw(ctx);
			
			if (obj.attractor !== null && (!obj.alive || !obj.attractor.alive)) {
				obj.attractor = null;
			}
			// Find and set an attractive black hole
			if (obj.alive && obj.attractor === null) {
				let hole = getOverlap(obj.x, obj.y); // n^2...
				if (hole !== null) {
					obj.attractor = hole;
				}
			}
			return obj.alive || obj.opacity > 0;
        });
		holes = holes.filter((obj) => {
			obj.draw(ctx);
			
			return obj.alive || obj.opacity > 0;
			// Dead and faded out, remove it from the array
        });
		
		// Flicker time when low
		if (time < 10 && (ticks % (FPS / 3)) == 0) {
			fadeInline($("#timer"), 160, 160, false);
		}
		// Flicker score when low
		if (score <= 0 && (ticks % (FPS / 3)) == 0) {
			fadeInline($("#scorer"), 160, 160, false);
		}
		// Game Over
		if (objects.length <= 0) {
			unpause();
			$("#gameover").fadeIn();
		}
    }
	ticks++;
    animateControl = setTimeout(animate, 1000 / FPS);
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
	
	intersects(x, y, marginX, marginY) {
		return x >= this.x - marginX 
				&& x <= this.x + marginX && y >= this.y - marginY && y <= this.y + marginY;
	}
	
	// To be overridden
	innerDraw (ctx) { }
	
	draw (ctx) {
		ctx.save();
		ctx.globalAlpha = this.opacity;
		ctx.translate(this.x, this.y);
		
		// Angular Momentum
		ctx.rotate(this.rotate * Math.PI / 180);
		this.rotate = (this.rotate + (this.moment / FPS)) % 360;
		
		this.innerDraw(ctx);
		
		ctx.restore();
		if (this.alive) {
			this.move();
		}
		if (this.alive && this.opacity < 1) {
			this.opacity += (2 / FPS); // Fade In 0.5 sec
		} else if (!this.alive && this.opacity > 0) {
			this.opacity -= (2 / FPS); // Fade Out 0.5 sec
		}
	}
	
	move () {
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
			// Movement
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
}

class BlackHole extends SpaceObject {
	
	constructor (x, y, type) {
		super(x, y, 60 * type.capacity);
		this.filled = 0;
		this.type = type;
		
		this.img = new Image();
		this.img.src = 'assets/images/' + type.name + '-hole.svg'; 
	}
	
	innerDraw (ctx) {
		ctx.drawImage(this.img, -(OBJ_WIDTH / 2), -(OBJ_HEIGHT / 2), OBJ_WIDTH, OBJ_HEIGHT);
		
		// Draw inner circle (white)
		ctx.fillStyle = "#ffffff";
		ctx.strokeStyle = "#ffffff";
		ctx.beginPath();
		ctx.arc(0,0,5,0,2*Math.PI);
		ctx.fill();
		ctx.closePath();
	}
}

class SpaceJunk extends SpaceObject {
	innerDraw (ctx) {
		ctx.fillRect(-(OBJ_WIDTH / 2), -(OBJ_HEIGHT / 2), OBJ_WIDTH, OBJ_HEIGHT);
	}
}


class SpaceRocket extends SpaceObject {

  innerDraw(ctx) {
    ctx.beginPath();
    ctx.moveTo(-7,10);
    ctx.lineTo(-15,24);
    ctx.lineTo(+15,24);
    ctx.lineTo(+7,10);
    ctx.lineTo(-7,10);
    ctx.closePath();
	
    let grd = ctx.createLinearGradient(0,0,0,140);
    grd.addColorStop(0.5,"yellow");
    grd.addColorStop(0.75,"orange");
    grd.addColorStop(1,"white");
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0,-25);
    ctx.bezierCurveTo(-7,-8,-7,0,-7,5);
    ctx.lineTo(-14,15);
    ctx.lineTo(-5,10);
    ctx.lineTo(0,15);
    ctx.lineTo(5,10);
    ctx.lineTo(14,15);
    ctx.lineTo(7,5);
    ctx.bezierCurveTo(7,0,7,-8,0,-25);
    ctx.closePath();
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.stroke();
  }
}

class Satellite extends SpaceObject {

  innerDraw(ctx) {
    ctx.beginPath();
    ctx.fillStyle ="black";
    ctx.fillRect(-2,-12,4,4);
    ctx.fillRect(-3,-8,6,16);
    ctx.moveTo(0,-12);
    ctx.lineTo(0,-14);
    ctx.moveTo(-5,-1);
    ctx.lineTo(5,-1);
    ctx.closePath();
    ctx.stroke();
  
    ctx.beginPath();
    ctx.fillStyle ="blue";
    ctx.rect(5,-6,20,10);
    ctx.rect(-25,-6,20,10);
    ctx.moveTo(5,-1);
    ctx.lineTo(25,-1);
    ctx.moveTo(-25,-1);
    ctx.lineTo(-5,-1);
    ctx.moveTo(12,-6);
    ctx.lineTo(12,4);
    ctx.moveTo(19,-6);
    ctx.lineTo(19,4);
    ctx.moveTo(-19,-6);
    ctx.lineTo(-19,4);
    ctx.moveTo(-12,-6);
    ctx.lineTo(-12,4);
    ctx.closePath();
    ctx.strokeStyle = "blue";
    ctx.stroke();
  
    ctx.beginPath();
    ctx.moveTo(-6,-16);
    ctx.lineTo(6,-16);
    
    ctx.moveTo(-4,-19);
    ctx.lineTo(4,-19);
  
    ctx.moveTo(-2,-22);
    ctx.lineTo(2,-22);
  
    ctx.closePath();
    ctx.strokeStyle = "red";
    ctx.stroke();
  }
}

$(document).ready(initialize);

