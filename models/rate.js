const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Schema = mongoose.Schema;

const rateSchema = new Schema({
	rate: {
		type: Number,
		min: 1,
		max: 5,
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

module.exports = mongoose.model("rate", rateSchema);
