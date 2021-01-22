const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Schema = mongoose.Schema;

const bookSchema = new Schema({
	title: {
		type: String,
		maxlength: 256,
		required: true,
	},
	author: {
		type: String,
		maxlength: 256,
		required: true,
	},
	isDelisted: {
		//list in library
		type: Boolean,
		default: true,
	},
	isBorrowed: {
		//set true if not available
		type: Boolean,
		default: false,
	},
	userId: {
		type: ObjectId,
		required: true,
	},
	photo: {
		type: String,
		required: true,
	},
});

module.exports = mongoose.model("book", bookSchema);
