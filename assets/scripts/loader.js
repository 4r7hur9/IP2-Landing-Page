(function () {
    const body = document.body;
    const fadeDurationMs = 480;
    const gifLoopDurationMs = 2000;
    const loader = document.querySelector(".site-loader");
    const loaderMedia = loader?.querySelector(".site-loader__media");

    if (!body) {
        return;
    }

    body.setAttribute("aria-busy", "true");

    let pageLoaded = document.readyState === "complete";
    let gifElapsed = false;
    let isHiding = false;

    const tryHideLoader = () => {
        if (isHiding || !body.classList.contains("loader-active") || !pageLoaded || !gifElapsed) {
            return;
        }

        isHiding = true;

        requestAnimationFrame(() => {
            if (loader) {
                loader.classList.add("loader-hidden");
            }

            window.setTimeout(() => {
                if (loader) {
                    loader.remove();
                }

                body.classList.remove("loader-active");
                body.setAttribute("aria-busy", "false");
            }, fadeDurationMs);
        });
    };

    if (loaderMedia && loaderMedia instanceof HTMLImageElement) {
        if (loaderMedia.complete) {
            window.setTimeout(() => {
                gifElapsed = true;
                tryHideLoader();
            }, gifLoopDurationMs);
        } else {
            loaderMedia.addEventListener("load", () => {
                window.setTimeout(() => {
                    gifElapsed = true;
                    tryHideLoader();
                }, gifLoopDurationMs);
            }, { once: true });
        }
    } else {
        window.setTimeout(() => {
            gifElapsed = true;
            tryHideLoader();
        }, gifLoopDurationMs);
    }

    if (document.readyState === "complete") {
        pageLoaded = true;
        tryHideLoader();
    } else {
        window.addEventListener("load", () => {
            pageLoaded = true;
            tryHideLoader();
        }, { once: true });
    }

    window.addEventListener("pageshow", event => {
        if (event.persisted) {
            pageLoaded = true;
            gifElapsed = true;
            tryHideLoader();
        }
    });
})();
