let fetch = require("./lib/fetch");

async function main() {
    for (let i = 0; i < 10; i++) {
        await fetch(i);
    }
}

main().then(v => console.log("done!"));
