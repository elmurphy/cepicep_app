const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
	username: {
		type: String,
		maxlength: 64,
		required: true,
	},
	password: {
		type: String,
		maxlength: 64,
		minlength: 8,
		required: true,
	},
	role: {
		type: String,
		enum: ["basic", "admin"],
		default: "basic",
	},
	readingPoints: {
		type: Number,
		default: 0,
	},
	avatarPath: {
		type: String,
	},
	isDeleted: {
		type: String,
		default: false,
	},
});

module.exports = mongoose.model("user", userSchema);
