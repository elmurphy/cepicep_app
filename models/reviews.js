const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
	review: {
		type: String,
		maxlength: 512,
		required: true,
	},
	isDeleted: {
		type: Boolean,
		default: false,
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

module.exports = mongoose.model("review", reviewSchema);
