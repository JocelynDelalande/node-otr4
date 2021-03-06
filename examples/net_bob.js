var net = require("net");
var otr = require("../index.js");

var user = new otr.User({
		keys: "./bob.keys",
		fingerprints: "./bob.fp",
		instags: "./bob.instags"
	}),
	account = user.account("bob@telechat.org", "telechat"),
	contact = account.contact("ALICE");

if (!account.fingerprint()) {
	console.log("no key found, run keygen.js to generate keys for this example.");
	process.exit();
}

if (!account.instag()) account.generateInstag();

console.log("connecting...");

var conn = new net.Socket();
var session = contact.openSession();

session.online = function () {
	if (conn && conn.remotePort) {
		return true;
	}
	return false;
};

session.on("inject_message", function (fragment) {
	try {
		conn.write(fragment);
	} catch (e) {}
});

session.on("gone_secure", function () {
	console.log("gone secure");
	session.send("Hello, World!");
});

session.on("plaintext", function () {
	console.log("back to plaintext");
	conn.end();
});

session.on("message", function (message, private) {
	console.log("We got a message:", message);
	console.log("Message was encrypted?:", private);
	session.end();
});

conn.on("data", function (data) {
	session.recv(data);
});

conn.on("end", function () {
	session.destroy();
	process.exit();
});

conn.on("error", function () {
	process.exit();
});

conn.connect(8123, function () {
	console.log("starting otr");
	session.start();
});
