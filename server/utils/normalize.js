const normalizeSpaces = value => value.replace(/\s+/g, " ").trim();

const cleanText = (value, maxLength = 500) => normalizeSpaces(String(value || "")).slice(0, maxLength);

const normalizeEmail = value => normalizeSpaces(String(value || "")).toLowerCase();

const normalizePhone = value => String(value || "").replace(/\D/g, "");

const normalizeName = value =>
    normalizeSpaces(String(value || ""))
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

const splitName = fullName => {
    const normalized = normalizeName(fullName);

    if (!normalized) {
        return { firstName: "", lastName: "" };
    }

    const parts = normalized.split(" ");

    return {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ")
    };
};

module.exports = {
    cleanText,
    normalizeEmail,
    normalizePhone,
    splitName
};
