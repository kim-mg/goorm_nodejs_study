var bingo = {
	user_name: null,
	is_my_turn: Boolean,
	ongame: Boolean,
	socket: null,
	cur_table: {
		rows: [0, 0, 0, 0, 0],
		cols: [0, 0, 0, 0, 0],
		diags: [0, 0]
	},
	numbers: [],
	
	init: function(socket){
		var self = this;
		var user_cnt = 0;
		
		this.is_my_turn = false;
		this.ongame = false;
		
		socket = io();
		
		socket.on("check_number", function(data){
			self.where_is_it(data.num, socket);
			self.print_msg(data.username + "님이 '" + data.num + "'번을 선택했습니다.");
			// self.check_bingo();
		});
		
		socket.on("game_started", function(data){
			console.log("enter the game_started");
			self.ongame = true;
			self.print_msg(data + " 님이 게임을 시작했습니다.");
			$("#start_button").hide();
			$("#restart_button").show();
		});
		
		socket.on("update_users", function(data, user_count){
			console.log(data, user_count, user_cnt);
			user_cnt = user_count;
			self.update_userlist(data, socket);
		});
		
		socket.on("game_ended", function(user, flag){
			console.log("ended game");
			self.ongame = false;
			if (flag == 1){
				self.print_msg("<알림> " + user + "님이 승리하셨습니다.");
			}
			else if (flag == 2){
				self.print_msg(user + "님이 게임을 종료했습니다.");
				self.print_msg("<알림> 게임이 종료되었습니다.");
			}
		});
		
		socket.on("game_restarted", function(){
			self.regame();
			self.print_msg("<알림> 게임을 다시 시작합니다.");
		});
		
		// 도메인 주소로부터 연결되었을 경우 form으로부터 받은 정보
		/*
		socket.on("connect", function(data){
			console.log(data);
			socket.emit("join", "익명 " + user_cnt);
		});
		*/
		
		var numbers = self.numbers;
		for(var i=1; i<=25; i++){
			numbers.push(i);
		}
		
		self.sorted_num();
		
		$("#user_info").on("submit", function(e){
			socket.emit("rename", $("#name").val());
			$("#name").val('');
			e.preventDefault();
		});
		
		$("table.bingo-board td").each(function(i){
			$(this).html(numbers[i]);
		
			$(this).click(function(){
				if(user_cnt == 1){
					self.print_msg("<알림> 최소 2명부터 게임이 가능합니다.");
				}
				else if(self.ongame == false){
					self.print_msg("<알림> 게임을 시작하십시오.");
				}
				else{
					self.print_msg("'" + numbers[i] + "'번을 선택하셨습니다.");
					self.select_num(this, socket, i);
				}
			});
		});
		
		$("#start_button").click(function(){
			if(user_cnt == 1){
				self.print_msg("<알림> 최소 2명부터 게임이 가능합니다.");
			}
			else{
				socket.emit('game_start');
				self.print_msg("<알림> 게임을 시작합니다.");
				self.ongame = true;
				$("#start_button").hide();
				$("#restart_button").show();
			}
		});
		
		$("#restart_button").click(function(){
			socket.emit("restart_game");
			
		});
	},
	
	regame: function(){
		var self = this;
		console.log("restart game!!");
		
		self.sorted_num();
		
		$("table.bingo-board td").each(function(i){
			$(this).html(self.numbers[i]);
			self.restart_num(this);
		});
	},
	
	sorted_num: function(){
		var self = this;
		
		self.numbers.sort(function(a,b){
			var temp = parseInt(Math.random() * 10);
			var isOddOrEven = temp%2;
			var isPosOrNeg = temp > 5 ? 1 : -1;
			return (isOddOrEven*isPosOrNeg);
		});
	},
	
	// init 끝
	select_num: function(obj, socket, idx){
		var self = this;
		
		if(self.is_my_turn && !$(obj).attr("checked")){
			// send num to other players
			socket.emit("select", { num: $(obj).text() });
			self.count_bingo(idx);
			self.check_num(obj);
			self.check_bingo(idx, socket);
			self.is_my_turn = false;
		}
		else{
			self.print_msg("<알림> 차례가 아닙니다!");
		}
	},
	
	where_is_it: function(num, socket){
		var self =  this;
		var obj = null;
		
		$("table.bingo-board td").each(function(i){
			if($(this).text() == num) {
				self.count_bingo(i);
				self.check_num(this);
				self.check_bingo(i, socket);
			}
		});
	},
	
	count_bingo: function(idx){
		var self = this;
		
		var quotient = parseInt(idx / 5);
		var remainder = idx % 5;
		var diagonal_left = idx % 6;
		var diagonal_right = idx % 4;

		if (diagonal_left == 0)
			self.cur_table.diags[0]++;
		if (idx < 21 && diagonal_right == 0)
			self.cur_table.diags[1]++;
		self.cur_table.rows[quotient]++;
		self.cur_table.cols[remainder]++;

		console.log(self.cur_table, idx, diagonal_left, diagonal_right);
	},
	
	check_bingo: function(idx, socket){
		var self = this;
		var q = parseInt(idx / 5);
		var r = idx % 5;
		console.log("check_bingo : ", q, r, self.cur_table, self.cur_table[q], self.cur_table[r]);
		if (self.cur_table.rows[q] == 5 || self.cur_table.cols[r] == 5 || self.cur_table.diags[0] == 5 || self.cur_table.diags[1] == 5){
			// user가 승리하였습니다. server로 보내서 broadcast로 전체 출력 후 게임 진행 불가
			socket.emit("game_end", self.user_name);
			self.print_msg(self.user_name + "님이 승리하셨습니다.");
			self.ongame = false;
			// 게임 init 다시~ : 태그에 있던 것들 초기화 빙고판 초기화
		}
	},
	
	check_num: function(obj){
		$(obj).css("text-decoration", "line-throuhg");
		$(obj).css("color", "lightgray");
		$(obj).attr("checked", true);
	},
	
	restart_num: function(obj){
		$(obj).css("text-decoration", "");
		$(obj).css("color", "");
		$(obj).removeAttr("checked");
	},
	
	update_userlist: function(data, this_socket){
		var self = this;
		$("#list").empty();
		// console.log(data);
		
		$.each(data, function(key, value){
			if(value.isconnect == 1){
				var turn = "(-) ";
				if(value.turn === true){
					turn = "(*) ";
					console.log(value.username);
					console.log($('#username').val());
					if(value.id == this_socket.id){
						self.is_my_turn = true;
					}
				}
				if(value.id == this_socket.id){
					self.user_name = value.username;
					$("#list").append("<font color='DodgerBlue'>" +
									 turn + value.username + 
									 "<br></font>");
				}
				else{
					$("#list").append("<font color='black'>" +
									 turn + value.username + 
									 "<br></font>");
				}
			}
		});
	},
	
	print_msg: function(msg){
		$("#logs").append(msg + "<br />");
		$('#logs').scrollTop($('#logs')[0].scrollHeight);
	}
	
};

$(document).ready(function(){
	bingo.init();
});