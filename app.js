'use strict';
var domain = require('domain');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var todos = require('./routes/todos');
var cloud = require('./cloud');
var AV = require('leanengine');
var multiparty = require('multiparty');

var app = express();
var fs = require('fs');
app.use(AV.Cloud.CookieSession({ secret: 'my secret', maxAge: 3600000, fetchUser: true }));

// 设置 view 引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// 加载云代码方法
app.use(cloud);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 未处理异常捕获 middleware
app.use(function(req, res, next) {
  var d = null;
  if (process.domain) {
    d = process.domain;
  } else {
    d = domain.create();
  }
  d.add(req);
  d.add(res);
  d.on('error', function(err) {
    console.error('uncaughtException url=%s, msg=%s', req.url, err.stack || err.message || err);
    if(!res.finished) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=UTF-8');
      res.end('uncaughtException');
    }
  });
  d.run(next);
});

app.get('^/$|/index', function(req, res){
	AV.initialize('YMYaJEC4RBmOHWTB5wieoI7L-gzGzoHsz', 'qH20zdz5ATGcqEQo9xOlwiba');
	if (!req.AV.user) {
    // 如果未登录，跳转到登录界面
		res.render('login');
	}
	res.render("index");
})

app.get('/query', function(req, res) {
	AV.initialize('YMYaJEC4RBmOHWTB5wieoI7L-gzGzoHsz', 'qH20zdz5ATGcqEQo9xOlwiba');
	if (!req.AV.user) {
    // 如果未登录，跳转到登录界面
		res.render('login');
	}
	var results = new Array();
	res.render('query', { result_set: results});
})

app.get('/importCsv', function(req, res){
	//TODO
	var filename;
	//解析，存数据库
})


//处理登录
function doLogin(req, res){
	AV.initialize('YMYaJEC4RBmOHWTB5wieoI7L-gzGzoHsz', 'qH20zdz5ATGcqEQo9xOlwiba');
	AV.User.logIn(req.body.logname, req.body.logpass).then(function(user) {
    //登录成功，AV.Cloud.CookieSession 会自动将登录用户信息存储到 cookie
    console.log('signin successfully: %j', user);
    res.redirect('/query');
  },function(error) {
    //登录失败，跳转到登录页面
    //res.redirect('/login');
	res.render('login');
  });
}
app.get('/login', doLogin);
app.post('/login', doLogin);

//插入新志愿者信息
function insert(req, res){
	AV.initialize('YMYaJEC4RBmOHWTB5wieoI7L-gzGzoHsz', 'qH20zdz5ATGcqEQo9xOlwiba');
	
	//读取文件
	/*var form = new multiparty.Form();
	form.parse(req, function(err, fields, files) {
    var iconFile = files.photo[0];
    if(iconFile.size !== 0){
      fs.readFile(iconFile.path, function(err, data){
        if(err) {
          res.render('test');
        }
        var base64Data = data.toString('base64');
        var theFile = new AV.File(iconFile.originalFilename, {base64: base64Data});
        theFile.save().then(function(theFile){
          res.render('test');
        });
      });
    } else {
      res.send('请选择一个文件。');
    }
  });
  
	SmartUpload su = new SmartUpload();//新建一个SmartUpload对象 
	*/
	var TestObject = AV.Object.extend('Volunteers');
	var testObject = new TestObject();
	testObject.save({
		name:req.param("name"),
		school:req.param("school"),
		email:req.param("email"),
		phone:req.param("phone")
	}, {
		success: function(object) {
			res.redirect("/query");
		}
	});
}

app.get('/add-volunteer', insert);
app.post('/add-volunteer', insert);

//查询姓名
function queryByName(req, res){
	//res.render("test");
	var input_name = req.param("name");
	console.log("=====================");
	console.log(input_name);
	//初始化 param1：应用 id、param2：应用 key
	AV.initialize('YMYaJEC4RBmOHWTB5wieoI7L-gzGzoHsz', 'qH20zdz5ATGcqEQo9xOlwiba');

	var query = new AV.Query('Volunteers');
	query.equalTo('name', input_name);
	query.find().then(function(results) {
		console.log("----------------------------------------------\n");
		console.log('Successfully retrieved ' + results.length + ' posts.');
		 
		var json_array = [];
		for(var i = 0; i < results.length; ++i){
			var js = {};
			js["id"] = results[i].id;
			js["name"] = results[i].get("name");
			js["school"] = results[i].get("school");
			js["email"] = results[i].get("email");
			js["phone"] = results[i].get("phone");
			json_array.push(js);
		}
		console.log("end");
		res.send(json_array);
		
	});
}
app.get('/query-name', queryByName);
app.post('/query-name', queryByName);

function updateVolunteer(req, res){
	console.log("update");
	//初始化 param1：应用 id、param2：应用 key
	AV.initialize('YMYaJEC4RBmOHWTB5wieoI7L-gzGzoHsz', 'qH20zdz5ATGcqEQo9xOlwiba');
	
	var TestObject = AV.Object.extend("Volunteer");
	var testObject = new TestObject;
	var query = new AV.Query('Volunteers');
			
	query.get(req.param("id")).then(function(testObject){
		testObject.set('name', req.param("name"));
		testObject.set('school', req.param("school"));
		testObject.set('email', req.param("email"));
		testObject.set('phone', req.param("phone"));
		testObject.save();
		res.redirect("/query");
	}, function(error){
		return;
	});
			

}
app.get('/update-volunteer', updateVolunteer);
app.post('/update-volunteer', updateVolunteer);


//测试渲染页面
app.get('/test', function(req, res){
	res.render('test');
});
app.get('/detail', function(req, res){
	res.render('detail');
});



// 可以将一类的路由单独保存在一个文件中
app.use('/todos', todos);

app.use(express.static('public'));

// 如果任何路由都没匹配到，则认为 404
// 生成一个异常让后面的 err handler 捕获
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handlers

// 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) { // jshint ignore:line
    var statusCode = err.status || 500;
    if(statusCode === 500) {
      console.error(err.stack || err);
    }
    res.status(statusCode);
    res.render('error', {
      message: err.message || err,
      error: err
    });
  });
}

// 如果是非开发环境，则页面只输出简单的错误信息
app.use(function(err, req, res, next) { // jshint ignore:line
  res.status(err.status || 500);
  res.render('error', {
    message: err.message || err,
    error: {}
  });
});

module.exports = app;
