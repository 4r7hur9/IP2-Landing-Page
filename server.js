const { createApp } = require("./server/app");
const { PORT } = require("./server/config/env");

const app = createApp();

app.listen(PORT, () => {
    console.log(`Site IP2 + Meta CAPI disponivel em http://localhost:${PORT}`);
});
