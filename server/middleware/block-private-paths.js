const blockedExactPaths = new Set([
    "/package.json",
    "/package-lock.json",
    "/server.js",
    "/.env",
    "/.env.example",
    "/.gitignore"
]);

const blockedPathPrefixes = ["/.git", "/node_modules", "/server"];

const isBlockedPrefix = pathname =>
    blockedPathPrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));

const blockPrivatePaths = (req, res, next) => {
    const pathname = req.path.replace(/\\/g, "/");

    if (blockedExactPaths.has(pathname) || isBlockedPrefix(pathname)) {
        res.sendStatus(404);
        return;
    }

    next();
};

module.exports = {
    blockPrivatePaths
};
