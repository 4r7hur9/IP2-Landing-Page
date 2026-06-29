// Interações da página inicial.

const planTabs = document.querySelectorAll("[data-plan-tab]");
const planPanels = document.querySelectorAll("[data-plan-panel]");

const definirModoDoPlano = planMode => {
    planTabs.forEach(planTab => {
        const isActive = planTab.dataset.planTab === planMode;
        planTab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    planPanels.forEach(planPanel => {
        planPanel.hidden = planPanel.dataset.planPanel !== planMode;
    });
};

planTabs.forEach(planTab => {
    planTab.addEventListener("click", () => {
        definirModoDoPlano(planTab.dataset.planTab);
    });
});

definirModoDoPlano("residential");

// Microinteração dos cards ao passar o mouse.
document.querySelectorAll(".premium-card, .highlight-card, .plan-card").forEach(planCard => {
    planCard.addEventListener("mousemove", event => {
        const cardRect = planCard.getBoundingClientRect();
        const mouseX = event.clientX - cardRect.left;
        const mouseY = event.clientY - cardRect.top;

        planCard.style.setProperty("--mouse-x", `${mouseX}px`);
        planCard.style.setProperty("--mouse-y", `${mouseY}px`);
    });
});
