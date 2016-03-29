var express          = require('express');
var fs               = require('fs');

module.exports = function(serviceManager) {

	var submitreplay = function(req, res) {
		var _data  = JSON.parse(req.body.data);
		var failed = false;

		console.log(req.files);

		// Check mimetype and file extension
		if(req.files.file.size > 0 && (req.files.file.mimetype != 'application/octet-stream' || req.files.file.extension != 'SC2Replay')) {
			failed = true;
			res.status(500).send('The selected file is not a Starcraft 2 replay.');
		}

		// Check filesize
		else if(req.files.file.size > 500000) {
			failed = true;
			res.status(500).send('The selected file is too big.');
		}

		// Check form data
		else if (typeof _data.name === 'undefined' || typeof _data.message === 'undefined' || typeof _data.timestamp === 'undefined') {
			failed = true;
			res.status(500).send('Please fill out all required fields.');
		}

		else if(typeof _data.video === 'undefined' && req.files.file.size == 0) {
			failed = true;
			res.status(500).send('Please include a replay or a link YouTube/Twitch link to your highlight.');
		}

		var category = '';

		if(_data.category === 'Plays') {
			category = 'Plays';
		}

		else if(_data.category === 'Fails') {
			category = 'Fails';
		}

		else if(_data.categoory === 'Funny') {
			category = 'Funny';
		}

		if(req.files.file.size != 0 && !failed) {
			var path = '/tmp/uploads/' + _data.name + '-' + new Date().getTime() / 1000 + '.SC2Replay';

			fs.readFile(req.files.file.path, function(err, data) {
				fs.writeFile(path, data, function (err) {
					if(err) {
						res.status(500).send('Something went wrong uploading your replay. Please try again.');
					}

					else {
						var mailData = {
							from: 'www-data@sc2hl.com',
							to: 'nikolaigulatz@googlemail.com',
							subject: 'SC2HL - Replay [' + _data.game + '][' + category + ']',
							text: 'Username: ' + _data.name + '\nEmail: ' + _data.email + '\nLink: ' + _data.video + '\nTimestamp: ' + _data.timestamp + '\nMessage: ' + _data.message,
							attachments: [{path: path}]}

							serviceManager.mail.sendMail(mailData, function(error, response) {
								if(error) {
									console.log('Error sending an E-Mail: ' + error);
									res.status(500).send('Something went wrong sending your E-Mail. Please try again.');
								}

								else {
									res.send('Your replay has been submitted successfully. Thanks!');
								}
							});
						}
					});
			});
		} else if(req.files.file.size == 0 && !failed) {
			var mailData = {
				from: 'www-data@sc2hl.com',
				to: 'nikolaigulatz@googlemail.com',
				subject: 'SC2HL - Replay [' + _data.game + '][' + category + ']',
				text: 'Username: ' + _data.name + '\nEmail: ' + _data.email + '\nLink: ' + _data.video + '\nTimestamp(s): ' + _data.timestamp + '\nMessage: ' + _data.message,
			}
			serviceManager.mail.sendMail(mailData, function(error, response) {
				if(error) {
					console.log('Error sending an E-Mail: ' + error);
					res.status(500).send('Something went wrong sending your E-Mail. Please try again.');
				}

				else {
					res.send('Your replay has been submitted successfully. Thanks!');
				}
			});
		}
	}

	var router = express.Router();

	router.post('/', submitreplay);

	return router;
}
