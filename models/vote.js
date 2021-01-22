const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Schema = mongoose.Schema;

const voteSchema = new Schema({
	liked: {
		type: Boolean,
		default: true,
	},
	reviewId: {
		type: ObjectId,
		required: true,
	},
	userId: {
		type: ObjectId,
		required: true,
	},
});

module.exports = mongoose.model("vote", voteSchema);
