(() => {
    const iconMarkupByName = {
        "4k": '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"></rect><path d="M7 14v-4l-2.2 2.2"></path><path d="M7 14h-3"></path><path d="M12 10v4"></path><path d="M12 12h2.5"></path><path d="M14.5 10v4"></path><path d="M18 10v4"></path><path d="M18 12h2.5"></path><path d="M20.5 10 18 12l2.5 2"></path>',
        account_circle: '<circle cx="12" cy="8" r="3.25"></circle><path d="M5 18c1.9-3 4.2-4.5 7-4.5S17.1 15 19 18"></path><circle cx="12" cy="12" r="8.5"></circle>',
        alternate_email: '<circle cx="12" cy="12" r="8.5"></circle><path d="M15.4 14.2c-.8.9-1.8 1.3-3 1.3-2.4 0-4-1.6-4-3.9 0-2.2 1.7-4 3.9-4 1.9 0 3.4 1.4 3.4 3.2v2c0 .8.3 1.2.9 1.2.8 0 1.4-.9 1.4-2.4 0-3.3-2.4-5.6-5.9-5.6-3.7 0-6.4 2.8-6.4 6.4 0 3.7 2.8 6.4 6.6 6.4 1.4 0 2.7-.3 3.9-1"></path><circle cx="12.2" cy="11.6" r="1.7"></circle>',
        apps: '<rect x="4" y="4" width="5" height="5" rx="1"></rect><rect x="10.5" y="4" width="5" height="5" rx="1"></rect><rect x="17" y="4" width="3" height="5" rx="1"></rect><rect x="4" y="10.5" width="5" height="5" rx="1"></rect><rect x="10.5" y="10.5" width="5" height="5" rx="1"></rect><rect x="17" y="10.5" width="3" height="5" rx="1"></rect><rect x="4" y="17" width="5" height="3" rx="1"></rect><rect x="10.5" y="17" width="5" height="3" rx="1"></rect><rect x="17" y="17" width="3" height="3" rx="1"></rect>',
        arrow_back: '<path d="M19 12H7"></path><path d="m11 8-4 4 4 4"></path>',
        arrow_forward: '<path d="M5 12h12"></path><path d="m13 8 4 4-4 4"></path>',
        arrow_right: '<path d="M6 12h11"></path><path d="m13 8 4 4-4 4"></path>',
        bolt: '<path d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z"></path>',
        business: '<rect x="4" y="4.5" width="9" height="15" rx="1.5"></rect><path d="M13 8.5h7v11H13"></path><path d="M7 8.5h3"></path><path d="M7 12h3"></path><path d="M7 15.5h3"></path><path d="M15.5 12h2"></path><path d="M15.5 15.5h2"></path>',
        call: '<path d="M6.8 4.5c.4-.4 1-.6 1.6-.4l2.1.7c.7.2 1.1.9 1 1.6l-.3 2c1 2 2.6 3.6 4.6 4.6l2-.3c.7-.1 1.4.3 1.6 1l.7 2.1c.2.6 0 1.2-.4 1.6l-1 1c-.8.8-2 1.1-3.1.8-2.4-.7-4.7-2.1-6.7-4.1s-3.4-4.3-4.1-6.7c-.3-1.1 0-2.3.8-3.1Z"></path>',
        chat: '<path d="M6 17.5 4.5 20V6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16H8.5L6 17.5Z"></path>',
        chevron_right: '<path d="m10 7 4 5-4 5"></path>',
        expand_more: '<path d="m7 10 5 5 5-5"></path>',
        favorite: '<path d="m12 20-1.4-1.2C6.1 15 3.5 12.6 3.5 9.5 3.5 7 5.4 5 8 5c1.5 0 3 .7 4 1.9 1-1.2 2.5-1.9 4-1.9 2.6 0 4.5 2 4.5 4.5 0 3.1-2.6 5.5-7.1 9.3Z"></path>',
        home: '<path d="M4 10.5 12 4l8 6.5"></path><path d="M6.5 9.5V20h11V9.5"></path><path d="M10 20v-5.5h4V20"></path>',
        hourglass_top: '<path d="M7 4h10"></path><path d="M7 20h10"></path><path d="M8 4v3c0 1.7 1 3.2 2.6 4L12 12l1.4-1c1.6-.8 2.6-2.3 2.6-4V4"></path><path d="M16 20v-3c0-1.7-1-3.2-2.6-4L12 12l-1.4 1c-1.6.8-2.6 2.3-2.6 4v3"></path>',
        location_on: '<path d="M12 20s-5.5-4.9-5.5-9.4A5.5 5.5 0 1 1 17.5 10.6C17.5 15.1 12 20 12 20Z"></path><circle cx="12" cy="10.5" r="2"></circle>',
        mail: '<rect x="3.5" y="6" width="17" height="12" rx="2"></rect><path d="m4.5 7 7.5 5 7.5-5"></path>',
        menu_book: '<path d="M5.5 5.5h6a3 3 0 0 1 3 3v10h-6a3 3 0 0 0-3 3Z"></path><path d="M18.5 5.5h-6a3 3 0 0 0-3 3v10h6a3 3 0 0 1 3 3Z"></path>',
        network_check: '<path d="M4 18h3"></path><path d="M4 14h5"></path><path d="M4 10h7"></path><path d="M4 6h9"></path><path d="m15 14 2.5 2.5L21 12"></path>',
        pan_tool: '<path d="M8 21V11.5a1.5 1.5 0 0 1 3 0V14"></path><path d="M11 14V9.5a1.5 1.5 0 0 1 3 0V14"></path><path d="M14 14v-3a1.5 1.5 0 0 1 3 0v4"></path><path d="M17 15v-1a1.5 1.5 0 0 1 3 0v3.5a3.5 3.5 0 0 1-3.5 3.5H11a4 4 0 0 1-4-4v-2l-2.2-1.8a1.4 1.4 0 0 1 1.8-2.1L8 12"></path>',
        person: '<circle cx="12" cy="8" r="3.2"></circle><path d="M5 19c1.8-3 4.2-4.5 7-4.5s5.2 1.5 7 4.5"></path>',
        phone_in_talk: '<path d="M6.8 4.5c.4-.4 1-.6 1.6-.4l2.1.7c.7.2 1.1.9 1 1.6l-.3 2c1 2 2.6 3.6 4.6 4.6l2-.3c.7-.1 1.4.3 1.6 1l.7 2.1c.2.6 0 1.2-.4 1.6l-1 1c-.8.8-2 1.1-3.1.8-2.4-.7-4.7-2.1-6.7-4.1s-3.4-4.3-4.1-6.7c-.3-1.1 0-2.3.8-3.1Z"></path><path d="M14.5 5.5a4 4 0 0 1 4 4"></path><path d="M14.5 8.5a1 1 0 0 1 1 1"></path>',
        policy: '<path d="M12 3.5 18.5 6v5.7c0 3.5-2.3 6.7-6.5 8.8-4.2-2.1-6.5-5.3-6.5-8.8V6L12 3.5Z"></path><path d="m9.5 12 1.7 1.7 3.3-3.4"></path>',
        send: '<path d="M4 19 20 12 4 5l3 7-3 7Z"></path><path d="M7 12h7"></path>',
        signal_cellular_alt: '<path d="M5 18h2v-3H5Z"></path><path d="M9 18h2v-6H9Z"></path><path d="M13 18h2V9h-2Z"></path><path d="M17 18h2V5h-2Z"></path>',
        speed: '<path d="M6.5 17a7 7 0 1 1 11 0"></path><path d="M12 12 16.5 9.5"></path><path d="M12 12v5"></path><path d="M7 17h10"></path>',
        support_agent: '<circle cx="12" cy="8" r="3.1"></circle><path d="M5.5 12a6.5 6.5 0 1 1 13 0"></path><path d="M4.5 12v2.5a1.5 1.5 0 0 0 1.5 1.5H7.5v-4H6a1.5 1.5 0 0 0-1.5 1.5Z"></path><path d="M19.5 12v2.5a1.5 1.5 0 0 1-1.5 1.5H16.5v-4H18a1.5 1.5 0 0 1 1.5 1.5Z"></path><path d="M9 19h6"></path>',
        target: '<circle cx="12" cy="12" r="7"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 5V3"></path><path d="M12 21v-2"></path><path d="M5 12H3"></path><path d="M21 12h-2"></path>'
    };

    const createIconSvg = iconName => {
        const bodyMarkup = iconMarkupByName[iconName];

        if (!bodyMarkup) {
            return "";
        }

        return `
            <svg class="local-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                ${bodyMarkup}
            </svg>
        `.trim();
    };

    const upgrade = rootNode => {
        const container = rootNode || document;
        const iconHolders = container.querySelectorAll(".material-symbols-outlined");

        iconHolders.forEach(iconHolder => {
            const iconName = (iconHolder.dataset.iconName || iconHolder.textContent || "").trim();

            if (!iconName || iconHolder.dataset.iconReady === "true") {
                return;
            }

            const svgMarkup = createIconSvg(iconName);

            if (!svgMarkup) {
                return;
            }

            iconHolder.dataset.iconName = iconName;
            iconHolder.dataset.iconReady = "true";
            iconHolder.setAttribute("aria-hidden", "true");
            iconHolder.innerHTML = svgMarkup;
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => upgrade(document));
    } else {
        upgrade(document);
    }

    window.IP2Icons = {
        upgrade
    };
})();
