const bcrypt = require("bcryptjs");

const plainTextPassword = process.argv[2];

if (!plainTextPassword) {
    console.error("Uso: npm run generate:password-hash -- \"sua-senha\"");
    process.exit(1);
}

bcrypt
    .hash(plainTextPassword, 12)
    .then(passwordHash => {
        console.log(passwordHash);
    })
    .catch(error => {
        console.error("Nao foi possivel gerar o hash da senha:", error.message);
        process.exit(1);
    });
