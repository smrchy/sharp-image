import config from "./config";
import * as morgan from "morgan";
import * as express from "express";
const app = express();

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
	skip: (req) => {
		return req.url === "/ping" || req.url === "/metrics";
	}
}));
app.enable("trust proxy");
app.disable("x-powered-by");
app.listen(config.app.port);
console.log("Listening on port ", config.app.port)
import { mw } from "./mw";

app.get("/image/*", mw.checkData, mw.loadImage, mw.processImage);

app.get("/ping", (req, res) => {
	res.send("PONG");
})

// Generic error handle
app.use( (err, req, res, next) => {
	res.status(err.status || 500);
	res.send({
		message: err.message
	});
});

// trap sigint and exit process - this is needed to make ctrl+c work in docker
process.on("SIGINT", () => {
	console.log("Received SIGINT, stopping application");
	process.exit();
});
