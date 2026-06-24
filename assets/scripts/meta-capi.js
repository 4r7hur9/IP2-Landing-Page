(function () {
    const endpoint = "/api/meta/events";
    const redirectUrl = "https://www.ip2internet.com.br/meta/redirect.html";

    const getCookie = name => {
        const value = document.cookie
            .split("; ")
            .find(entry => entry.startsWith(`${name}=`));

        return value ? decodeURIComponent(value.split("=").slice(1).join("=")) : "";
    };

    const getFbclid = () => new URLSearchParams(window.location.search).get("fbclid") || "";

    const createEventId = prefix => {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return `${prefix}_${window.crypto.randomUUID()}`;
        }

        return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    };

    const normalizeText = value => String(value || "").replace(/\s+/g, " ").trim();

    const postEvent = (payload, options) =>
        fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            keepalive: Boolean(options && options.keepalive),
            body: JSON.stringify(payload)
        }).catch(() => null);

    const queueEvent = payload => {
        const body = JSON.stringify(payload);

        if (navigator.sendBeacon) {
            const blob = new Blob([body], { type: "application/json" });

            if (navigator.sendBeacon(endpoint, blob)) {
                return Promise.resolve({ queued: true });
            }
        }

        return postEvent(payload, { keepalive: true });
    };

    const getBaseUserData = () => ({
        fbp: getCookie("_fbp"),
        fbc: getCookie("_fbc"),
        fbclid: getFbclid()
    });

    const trackBrowserEvent = (eventName, params, eventId) => {
        if (typeof window.fbq !== "function") {
            return;
        }

        window.fbq("track", eventName, params || {}, { eventID: eventId });
    };

    const trackPageView = pageType => {
        const eventId = createEventId("pageview");

        trackBrowserEvent("PageView", {}, eventId);

        return postEvent(
            {
                event_name: "PageView",
                event_id: eventId,
                event_source_url: window.location.href,
                user_data: getBaseUserData(),
                custom_data: {
                    page_type: pageType || document.body.getAttribute("data-meta-page") || ""
                }
            },
            { keepalive: true }
        );
    };

    const trackLead = leadData => {
        const data = leadData || {};
        const eventId = createEventId("lead");

        trackBrowserEvent(
            "Lead",
            {
                content_name: "lead_form",
                content_category: data.profile || "site_lead"
            },
            eventId
        );

        return postEvent(
            {
                event_name: "Lead",
                event_id: eventId,
                event_source_url: window.location.href,
                user_data: {
                    ...getBaseUserData(),
                    email: data.email || "",
                    phone: data.phone || "",
                    name: data.name || ""
                },
                custom_data: {
                    content_name: "lead_form",
                    content_category: data.profile || "site_lead",
                    plan_interest: data.planInterest || "",
                    profile: data.profile || "",
                    status: "submitted"
                }
            },
            { keepalive: true }
        );
    };

    const trackRedirectLeadClick = link => {
        const buttonLabel =
            normalizeText(link.getAttribute("data-meta-label")) ||
            normalizeText(link.getAttribute("aria-label")) ||
            normalizeText(link.textContent) ||
            "redirect_button";
        const pageType = document.body.getAttribute("data-meta-page") || "";
        const eventId = createEventId("lead_click");

        trackBrowserEvent(
            "Lead",
            {
                content_name: buttonLabel,
                content_category: "redirect_button",
                status: "clicked"
            },
            eventId
        );

        return queueEvent({
            event_name: "Lead",
            event_id: eventId,
            event_source_url: window.location.href,
            user_data: getBaseUserData(),
            custom_data: {
                content_name: buttonLabel,
                content_category: "redirect_button",
                page_type: pageType,
                status: "clicked"
            }
        });
    };

    const bindRedirectLeadTracking = () => {
        document.addEventListener(
            "click",
            event => {
                const target = event.target;
                const link = target instanceof Element ? target.closest(`a[href="${redirectUrl}"]`) : null;

                if (!link) {
                    return;
                }

                trackRedirectLeadClick(link);
            },
            true
        );
    };

    const autoTrackPageView = () => {
        if (window.__ip2MetaPageViewTracked) {
            return;
        }

        window.__ip2MetaPageViewTracked = true;
        trackPageView(document.body.getAttribute("data-meta-page"));
    };

    window.IP2Meta = {
        trackRedirectLeadClick,
        trackLead,
        trackPageView
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            () => {
                autoTrackPageView();
                bindRedirectLeadTracking();
            },
            { once: true }
        );
    } else {
        autoTrackPageView();
        bindRedirectLeadTracking();
    }
}());
