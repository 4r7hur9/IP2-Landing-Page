const bcrypt = require("bcryptjs");

const plainTextPassword = process.argv[2];

if (!plainTextPassword) {
    console.error("Use: npm run generate:password-hash -- \"your-password\"");
    process.exit(1);
}

bcrypt
    .hash(plainTextPassword, 12)
    .then(passwordHash => {
        console.log(passwordHash);
    })
    .catch(error => {
        console.error("Unable to generate password hash:", error.message);
        process.exit(1);
    });
