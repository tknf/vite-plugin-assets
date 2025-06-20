import { Hono } from "hono";
import { asset } from "../../../src";

const app = new Hono();

app.get("/", (c) => {
	return c.html(
		<html lang="ja">
			<head>
				{import.meta.env.DEV && <script type="module" src="/@vite/client"></script>}
				<link rel="stylesheet" href={asset("/src/assets/main.css")} />
				<script type="module" src={asset("/src/assets/main.ts")} />
			</head>
			<body>
				<h1>Hello</h1>
				<greeting-message></greeting-message>
			</body>
		</html>
	);
});

export default app;
