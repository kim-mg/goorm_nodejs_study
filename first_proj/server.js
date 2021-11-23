var app = require('http').createServer(handler),
    io = require('socket.io')(app),
    fs = require('fs');

app.listen(3000);

// index.html을 불러오고 에러가 났을 경우 처리
function handler (req, res) {
	fs.readFile('index.html', function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		res.writeHead(200);
		res.end(data);
	});
}

// connection은 사용자가 웹사이트를 열면 자동으로 발생하는 이벤트
// 이 때 이벤트 안의 함수로 socket이 전달
// 접속한 각 클라이언트에 관련한 이벤트를 작성하려면
// connection의 리스너 함수 안에서 socket 사용
io.on('connection', function (socket) {	// 1
	socket.emit('news', { serverData : "서버 작동" });
	
	socket.on('client login', function (data) {	// 2
		console.log(data);
	});
	
	socket.on('disconnect', function () {	// 3
		console.log('접속이 종료되었습니다.');
	});
	
});