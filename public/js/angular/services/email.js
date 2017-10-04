angular.module('email', [])
.service('emailService', function() {
	this.checkEmailMatch = function(email1, email2) {
		return email1 === email2;
	};

});
