const { createApp } = require("./server/app");
const { PORT } = require("./server/config/env");

const app = createApp();

app.listen(PORT, () => {
    console.log(`IP2 site + Meta CAPI listening on http://localhost:${PORT}`);
});
