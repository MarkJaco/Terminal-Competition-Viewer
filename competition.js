var c = document.getElementById("canvas");
var ctx = c.getContext("2d");
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

function drawLine(x1, y1, x2, y2, ctx){
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

class Match{
	constructor(winner, loser, round_num){
		this.winner = winner
		this.loser = loser
		this.players = [winner, loser]
		this.player_names = [winner["displayName"], loser["displayName"]]
		this.round_num = round_num
		this.left_child_match = null
		this.right_child_match = null
		this.x = null
		this.y = null
	}

	draw(ctx, yd, xd, max_rounds){
		ctx.font = "20px Arial"
		ctx.strokeText(this.winner["displayName"], this.x - xd, this.y)
		if(this.round_num !== max_rounds){
			drawLine(this.x, this.y, this.x - xd, this.y, ctx)
		}
		else{
			drawLine(this.x - xd / 2, this.y, this.x - xd, this.y, ctx)
		}
		drawLine(this.x - xd, this.y - yd / 2, this.x - xd, this.y + yd / 2, ctx)
		drawLine(this.x - xd, this.y - yd / 2, this.x - 2 * xd, this.y - yd / 2, ctx)
		drawLine(this.x - xd, this.y + yd / 2, this.x - 2 * xd, this.y + yd / 2, ctx)
		if(this.right_child_match == null){
			ctx.strokeText(this.winner["displayName"], this.x - 2 * xd, this.y + yd / 2)
		}
		if(this.left_child_match == null){
			ctx.strokeText(this.loser["displayName"], this.x - 2 * xd, this.y - yd / 2)
		}
	}
}

class CompetitionTree{
	constructor(json_data, bracket_num){
		this.json_data = json_data
		this.bracket_num = bracket_num
	}

	get_bracket_matches(){
		let matches = this.json_data["data"]["matches"]
		let relevant_matches = []
		for (let i = 0; i < matches.length; i++) {
			if(matches[i]["bracket"] == this.bracket_num){
				relevant_matches.push(matches[i])
			}
		}
		return relevant_matches
	}

	process_matches(){
		let relevant_matches = this.get_bracket_matches()
		let matches = []
		for (var i = 0; i < relevant_matches.length; i++) {
			matches.push(new Match(relevant_matches[i]["winning_user"], relevant_matches[i]["losing_user"], relevant_matches[i]["round"]))
		}
		return matches
	}

	create_tree(){
		let matches = this.process_matches()
		for (let i = 0; i < matches.length; i++) {
			for (let j = 0; j < matches.length; j++) {
				if(matches[i].round_num - 1 === matches[j].round_num){
					if(matches[j].player_names.includes(matches[i].winner["displayName"])){
						matches[i].right_child_match = matches[j]
					}
					if(matches[j].player_names.includes(matches[i].loser["displayName"])){
						matches[i].left_child_match = matches[j]
					}
				}
			}
		}
		return matches[matches.length - 1]
	}

	get_first_y_len(max_rounds, window_height){
		let divisor = 0
		for (var i = 0; i < max_rounds; i++) {
			divisor += Math.pow(2, i)
		}
		return (Math.pow(2, max_rounds - 1) * window_height) / divisor
	}

	draw(ctx){
		let xmargin = window.innerWidth / 20
		let ymargin = window.innerHeight / 20
		let final_match = this.create_tree()
		let first_y_len = this.get_first_y_len(final_match.round_num, window.innerHeight - ymargin)
		final_match.x = window.innerWidth - xmargin
		final_match.y = window.innerHeight / 2
		let x_difference = (window.innerWidth - 2*xmargin) / (final_match.round_num + 1)
		let queue = [final_match]
		for(let i = 0; i < queue.length; i++){
			if(queue[i] == null){continue}
			let y_len = first_y_len / (Math.pow(2, final_match.round_num - queue[i].round_num))
			if(queue[i].right_child_match !== null){
				queue[i].right_child_match.y = queue[i].y + y_len / 2
				queue[i].right_child_match.x = queue[i].x - x_difference
			}
			if(queue[i].left_child_match !== null){
				queue[i].left_child_match.y = queue[i].y - y_len / 2
				queue[i].left_child_match.x = queue[i].x - x_difference
			}
			queue[i].draw(ctx, y_len, x_difference, final_match.round_num)
			queue.push(queue[i].right_child_match)
			queue.push(queue[i].left_child_match)
		}
	}
}



function start(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	competition_id = document.getElementById("comp_id").value
	bracket_num = document.getElementById("bracket_num").value

	json_url = "https://terminal.c1games.com/api/game/competition/"+competition_id+"/matches"
	$.getJSON(json_url, function(data){
		let t = new CompetitionTree(data, bracket_num)
		t.draw(ctx)
	})
}
