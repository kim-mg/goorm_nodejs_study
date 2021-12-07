var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.set('views', './views');
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	// 루트 페이지로 접속 시 chat.pug 렌더링
	res.render('chat');
});

var users = {};
var count = 1;
// 채팅방에 접속했을 때 - 1
io.on('connection', function(socket) {
	console.log('user connected: ', socket.id);
	var name = "익명" + count;
	socket.name = name;
	io.to(socket.id).emit('create name', name);

	io.emit('new_connect', name);
	
	// 접속중인 유저 확인
	users[count] = {};
	users[count].isconnect = 1;
	users[count].id = socket.id;
	users[count].name = socket.name;
	count++;
	console.log(users, count);
	io.emit('update_users', users)
	
	// 채팅방 접속이 끊어졌을 때 -2
	socket.on('disconnect', function() {
		console.log('user disconnected: ' +
				   socket.id + ' ' + socket.name);
		for(var i=1; i<count; i++){
			if(users[i].id == socket.id)
				users[i].isconnect = 0;
		};
		io.emit('update_users', users)
		io.emit('new_disconnect', socket.name);
	});
	
	socket.on('send message', function(name, text) {
		var msg = name + ' : ' + text;
		if(name != socket.name){
			for(var i=1; i<count; i++){
				if(users[i].id == socket.id)
					users[i].name = name;
			};
			io.emit('update_users', users);
			io.emit('change name', socket.name, socket.name = name);
		}
		console.log(msg);
		io.emit('receive message', msg);
	});
	
});

http.listen(3000, function(){
	console.log('server on..');
});