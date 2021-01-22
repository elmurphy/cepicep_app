const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Schema = mongoose.Schema;

const borrowhistorySchema = new Schema({
	bookId: {
		type: ObjectId,
		required: true,
	},
	userId: {
		type: ObjectId,
		required: true,
	},
	date: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("borrowhistory", borrowhistorySchema);
