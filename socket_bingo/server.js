var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

// view engine setup
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.render('main', { title: '온라인 빙고 게임', username: req.query.username });
});

var users = {};
var user_count = 0;
var user_nums = 0;
var start_idx = 0;
var turn_count = 0;
var ingame_user_cnt = 0;

io.on('connection', function(socket){
	console.log('user connected : ' + socket.id);
	
	var username = "익명 " + user_nums;
	socket.username = username;

	users[user_nums] = {};
	users[user_nums].isconnect = 1;
	users[user_nums].id = socket.id;
	users[user_nums].username = username;
	users[user_nums].turn = false;
	user_nums++;
	user_count++;
	console.log(users, user_nums, user_count, start_idx);
	io.emit('update_users', users, user_count);
	
	// 도메인 주소의 정보(form)로부터 값을 가져올 경우 서버에 적용시키는 방법
	/*
	socket.on('join', function(username){
		var username = username;
		socket.username = username;
		
		users[user_nums] = {};
		users[user_nums].isconnect = 1;
		users[user_nums].id = socket.id;
		users[user_nums].name = username;
		users[user_nums].turn = false;
		user_nums++;
		user_count++;
		console.log(users, user_nums, user_count, start_idx);
		io.emit('update_users', users, user_count);
	});
	*/
	
	socket.on('rename', function(re_username){
		if(re_username != socket.username){
			for(var i=start_idx; i<user_nums; i++){
				if(users[i].id == socket.id)
					users[i].username = re_username;
					socket.username = re_username;
			}
			io.emit('update_users', users, user_count);
		}
	});
	
	socket.on('game_start', function(){
		socket.broadcast.emit("game_started", socket.username);
		ingame_user_cnt = user_count;
		turn_count = start_idx;
		users[turn_count].turn = true;
		
		io.emit('update_users', users);
	});
	
	socket.on('game_end', function(winner){
		socket.broadcast.emit("game_ended", winner, 1);
	});
	
	socket.on('restart_game', function(){
		io.emit("game_restarted");
	});
	
	socket.on('select', function(data){
		socket.broadcast.emit("check_number", { username : socket.username, num : data.num});
		
		users[turn_count].turn = false;
		turn_count++;
		
		if(turn_count >= user_nums){
			turn_count = start_idx;
		}
		
		while(users[turn_count].isconnect == 0){
			turn_count++;
			
			if(turn_count >= user_nums){
				turn_count = start_idx;
			};
		}
		
		users[turn_count].turn = true;
		
		io.emit('update_users', users);
	});
	
	socket.on('disconnect', function(){
		console.log('user disconnected : ' + socket.id, socket.username);
		for(var i=start_idx; i<user_nums; i++){
			if(users[i].isconnect == 1 && users[i].id == socket.id){
				users[i].isconnect = 0;
				if(i == start_idx){
					for(var j=start_idx; j<user_nums; j++){
						if(users[j].isconnect == 1){
							start_idx = j;
							break;
						}
					}
				}
			}
		};
		
		user_count--;
		if (user_count < ingame_user_cnt){
			io.emit('game_ended', socket.username, 2);
		}
		io.emit('update_users', users, user_count);
	});
});

http.listen(3000, function(){
	console.log('server on!!');
});