var Controller = function(request, response)
{
	this.request = request;
	this.response = response;
};
Controller.prototype.index = function()
{
	this.response.write('This is the home controller.');
}
module.exports = Controller;
