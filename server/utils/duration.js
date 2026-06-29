const DURATION_PATTERN = /^(\d+)(ms|s|m|h|d)?$/i;

const UNIT_TO_MILLISECONDS = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    ms: 1,
    s: 1000
};

const parseDurationToMilliseconds = durationValue => {
    if (typeof durationValue === "number" && Number.isFinite(durationValue)) {
        return durationValue;
    }

    if (typeof durationValue !== "string") {
        return 0;
    }

    const normalizedValue = durationValue.trim().toLowerCase();
    const matchedDuration = normalizedValue.match(DURATION_PATTERN);

    if (!matchedDuration) {
        return 0;
    }

    const [, numericValue, rawUnit] = matchedDuration;
    const durationUnit = rawUnit || "ms";
    const parsedValue = Number(numericValue);

    return parsedValue * UNIT_TO_MILLISECONDS[durationUnit];
};

module.exports = {
    parseDurationToMilliseconds
};
