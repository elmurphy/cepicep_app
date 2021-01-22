const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Schema = mongoose.Schema;

const userbanSchema = new Schema({
	banned: {
		type: Date,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	userId: {
		type: ObjectId,
		required: true,
	},
});

module.exports = mongoose.model("userban", userbanSchema);
