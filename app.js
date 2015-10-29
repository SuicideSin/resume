var config = require('./application/config/default.json');

var node = {};
node.http = require('http');
node.url = require('url');
node.path = require('path');
node.fs = require('fs');

function _404()
{
	// TODO: handle 404 stuff
}

var dumpError = function(error)
{
	if (typeof error === 'object')
	{
		if (error.message != null)
		{
			console.log('Message: ' + error.message);
		}
		if (error.stack != null)
		{
			console.log('Stacktrace:');
			console.log('====================');
			console.log(error.stack);
		}
		if (error.message == null && error.stack == null)
		{
			console.trace(error);
		}
	}
	else
	{
		console.trace(error);
	}
}

function handleRequest(request, response)
{
	var url = node.url.parse(request.url);
	var pathString = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '');

	var filename = node.path.join('./public', pathString);
	try
	{
		var extension = node.path.extname(filename).split(".")[1];
		var stat = node.fs.lstatSync(filename);
		if (stat.isFile())
		{
			if (config.mimeTypes != null && config.mimeTypes[extension] != null)
			{
				var mimeType = config.mimeTypes[extension];
				response.writeHead(200, {'Content-Type': mimeType});
			}
			var fileStream = node.fs.createReadStream(filename);
			fileStream.pipe(response);
			return;
		}
	}
	catch(e)
	{
		if (e.code !== 'ENOENT')
		{
			dumpError(e);
		}
	}

	path = pathString.split(/\/+/);
	for (var index in path)
	{
		path[index] = decodeURI(path[index]);
	}

	var controller = (path[0] || config.routing.defaultController).toLowerCase();
	var method = (path[1] || "index").toLowerCase();
	var arguments = [];
	if (path.length > 2)
	{
		arguments = path.slice(2);
	}

	var controllerPath = node.path.resolve('./application/controllers/' + controller + '.js');
	delete require.cache[controllerPath];
	try
	{
		var ControllerClass = require(controllerPath);
	}
	catch (e)
	{
		console.log('\nController file "' + controllerPath + '" could not be found');
		dumpError(e);
		_404();
		response.end();
		return;
	}

	try
	{
		var controllerObject = new ControllerClass(request, response);
	}
	catch (e)
	{
		console.log('\nController file "' + controllerPath + '" does not properly export a Controller class.');
		dumpError(e);
		_404();
		response.end();
		return;
	}

	if (controllerObject[method] == null)
	{
		console.log('\nController `' + controller + '` does not have a `' + method + '` method');
	}
	else
	{
		try
		{
			controllerObject[method].apply(controllerObject, arguments);
		}
		catch (e)
		{
			console.log('\nError running `' + controller + '.' + method + '("' + arguments.join('", "') + '")`');
			dumpError(e);
			_404();
			response.end();
			return;
		}
	}

	response.end();
}

var server = node.http.createServer(handleRequest);

server.listen(config.port, function()
{
	console.log("Server listening on: http://localhost:%s", config.port);
});

process.on('SIGINT', function()
{
	process.exit();
});
