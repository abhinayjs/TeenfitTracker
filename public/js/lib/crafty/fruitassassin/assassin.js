playFruitAssassin = function(callback) {
	// this.callback = callback;
	Crafty.init(550, 440);

	Crafty.c("Button", {
    	init: function () {
        	var req = (!Crafty.mobile || (Crafty.mobile && !Crafty.multitouch())) ? "Mouse" : "Touch";
        	this.requires(req);
    	}
	});
	
	Crafty.sprite(64, "/js/lib/crafty/fruitassassin/images/fruit.png", {
		banana: [0,0],
		apple: [1,0],
		watermelon: [2,0],
		orange: [3,0],
		coconut: [4,0],
		lemon: [5,0]
	});
	
	Crafty.background("url('/js/lib/crafty/fruitassassin/images/bg.png') no-repeat");
	
	var scoreEnt = Crafty.e("2D, DOM, Text").attr({x: 5, y: 5, w: Crafty.viewport.width, h: 50}).text("Score: 0"),
		score = 0;
	Crafty.e("2D, DOM, Color, Button, Text").attr({x: 100, y: 5, w: 50, h: 50}).color("Green").text("Start").bind('Click', function(MouseEvent){

  		Crafty.c("Fruit", {
			_choice: ["banana", "apple", "watermelon", "orange", "coconut", "lemon"],
			_xspeed: 0,
			_yspeed: 0,
		
			init: function() {
				var index = Crafty.math.randomInt(0, 5),
					fruit = this._choice[index],
					rotation = Crafty.math.randomInt(8, 12),
					direction = Crafty.math.randomInt(0, 1);
				
				this.addComponent(fruit).origin("center");
				this.y = Crafty.viewport.height;
				this._yspeed = Crafty.math.randomInt(8, 12);
				this.z = 1;
			
				if(direction) {
					this.x = 0;
					this._xspeed = Crafty.math.randomInt(3, 5);
				} else {
					this.x = Crafty.viewport.width;
					this._xspeed = -1 * Crafty.math.randomInt(3, 5);
				}
			
				this.bind("EnterFrame", function() {
					this.rotation += rotation;
					this.y -= this._yspeed;
					this.x += this._xspeed;
				
					if(this._y > Crafty.viewport.height) {
						this.destroy();
						if(!this.hit) {
							score -= (index+1) * 10;
							scoreEnt.text("Score: "+score);
						}
					}
				});
			
				this.bind("MouseOver", function() {
					this.sprite(index, 1);
					this.hit = true;
					score += (index+1) * 10;
					scoreEnt.text("Score: "+score);
				
					Crafty.e("2D, DOM, "+fruit).attr({z:0, x: this._x, y: this._y, alpha: 0.2}).sprite(index, 2);
				
					this.unbind("MouseOver");
				});
			}
		});
	
		Crafty.e().bind("EnterFrame", function(e) {
			var sparsity = Crafty.math.randomInt(10, 50);
			if(e.frame % sparsity == 0) {
				Crafty.e("2D, DOM, Fruit, Gravity, Mouse").gravity();
			}
		});
	
	});
	Crafty.e("2D, DOM, Color, Button, Text").attr({x: 200, y: 5, w: 50, h: 50}).color("Red").text("Stop").bind('Click', function(MouseEvent){
		var endTitle = Crafty.e("2D, DOM, Text").attr({x: 100, y: 100, w: 100, h: 100}).text("The End"),score1=0;
		Crafty.stop();
		callback('Fruit Assassin',score);
	});
	
};