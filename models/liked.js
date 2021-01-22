const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Schema = mongoose.Schema;

const likedSchema = new Schema({
	liked: {
		type: Boolean,
		required: true,
	},
	reviewId: {
		type: ObjectId,
		required: true,
	},
	bookId: {
		type: ObjectId,
		required: true,
	},
	userId: {
		type: ObjectId,
		required: true,
	},
});

module.exports = mongoose.model("liked", likedSchema);
