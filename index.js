const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const fileUpload = require('express-fileupload');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());

require("./jwt-strategy");
require("./endpoints")(app);
require("./mongo_setup")();
require("./swagger_setup")(app);

app.use(passport.initialize());
app.use(passport.session());

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});
