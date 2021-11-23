// 1. 클라이언트 객체를 생성하여 redis 서버와 연결하는 코드
var redis = require('redis');
var client = redis.createClient();
client.on('error', function (err){
	console.log('Error ' + err);
});

// 2. 데이터 조작하기 (key/value)
client.set('String Key', 'String Value', redis.print);

client.get('String key', function(err, value){
	if(err) throw err;
	console.log(value);
});

// 3. 해시테이블(해시맵) 데이터 조작하기
client.hmset('codigm', {
    'goormIDE' : 'cloud service',
    'goormEDU' : 'edu service'
}, redis.print);           

// 해시 테이블 추가 및 결과 출력
client.hset('Hash Key', 'HashTest 1', '1', redis.print);
client.hset(['Hash Key', 'HashTest 2', '2'], redis.print);

// codigm의 해시테이블에서 goormIDE 값 가져오기
client.hget('codigm', 'goormIDE', function(err,value) {
    if(err) throw err;
	// 해당 값 출력
    console.log('goormIDE is : ' + value);
});

// camping의 해시테이블 모든 키 데이터 가져오기
client.hkeys('codigm', function(err,keys) {
    if(err) throw err;
    keys.forEach(function(key, i) {
        console.log('codigm ' + i + ' : ' + key );
    });
});

// 4. 리스트에 존재하는 데이터 조작하기
// 리스트에 값 추가
client.lpush('tasks', 'Node.js', redis.print);            
client.lpush('tasks', 'Redis', redis.print);
// 시작, 종료인자 이용해 리스트 항목 가져오기
client.lrange('tasks', 0, -1, function(err, items){            
            // -1는 리스트의 마지막 항목 의미, 즉 다 가져오기
    if(err) throw err; items.forEach(function(item, i){
        console.log('list ' + i + ' : ' + item); });
});

// 5. SET에 데이터 조작하기
// Reply : 1 
client.sadd('test', 'goorm', redis.print);            
// Reply : 1
client.sadd('test', 'codigm', redis.print);           
// Reply : 0    -> 다음과 같이 reply 값이 0이 되는 것은, 두번째 저장하는 것이라 무시가 되는 것이다.
client.sadd('test', 'goorm', redis.print);            
// Reply : 1
client.sadd('test', 'codigm2', redis.print);            
client.smembers('test', function(err,data){
    console.log(data);
});