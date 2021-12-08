var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

// view engine setup
app.set('views', path.join(__dirname, '/public/views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.render('main', { title: '온라인 빙고 게임', 
					   username: req.query.username });
});

var users = {};
var user_count = 0;
var user_nums = 0;
var start_idx = 0;
var turn_count = 0;

io.on('connection', function(socket){
	console.log('user connected : ' + socket.id);
	
	var username = "익명 " + user_nums;
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
	
	socket.on('rename', function(username){
		if(username != socket.name){
			for(var i=start_idx; i<user_nums; i++){
				if(users[i].id == socket.id)
					users[i].name = username;
					socket.username = username;
			}
			io.emit('update_users', users, user_count);
		}
	});
	
	socket.on('game_start', function(data){
		socket.broadcast.emit("game_started", data);
		users[turn_count].turn = true;
		
		io.emit('update_users', users);
	});
	
	socket.on('select', function(data){
		socket.broadcast.emit("check_number", data);
		
		users[turn_count].turn = false;
		turn_count++;
		while(users[turn_count].isconnect == 0)
			turn_count++;
		
		if(turn_count >= user_count){
			turn_count = start_idx;
		};
		users[turn_count].turn = true;
		
		io.sockets.emit('update_users', users);
	});
	
	socket.on('disconnect', function(){
		console.log('user disconnected : ' + socket.id, socket.username);
		for(var i=start_idx; i<user_count; i++){
			if(users[i].isconnect == 1 && users[i].id == socket.id){
				users[i].isconnect = 0;
				if(i == start_idx)
					start_idx++;
			}
		};
		
		user_count--;
		io.emit('update_users', users, user_count);
	});
});

http.listen(3000, function(){
	console.log('server on!!');
});