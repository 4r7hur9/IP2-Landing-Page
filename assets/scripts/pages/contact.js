// Interações da página de contato.

const leadForm = document.getElementById("lead-form");
const leadStatus = document.getElementById("lead-form-status");
const leadSubmit = document.getElementById("lead-submit");
const leadNext = document.getElementById("lead-next");
const whatsappField = document.getElementById("lead-whatsapp");
const trackingFieldNames = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid"
];

const definirStatusDoFormulario = (statusType, statusMessage) => {
    leadStatus.textContent = statusMessage;
    leadStatus.className = `status-banner is-visible ${statusType}`;
};

const sincronizarMetadadosDaPagina = () => {
    const pageSearchParams = new URLSearchParams(window.location.search);

    trackingFieldNames.forEach(fieldName => {
        const formField = leadForm.elements[fieldName];

        if (formField) {
            formField.value = pageSearchParams.get(fieldName) || "";
        }
    });

    leadForm.elements.captured_at.value = new Date().toISOString();
    leadForm.elements.page_url.value = window.location.href;
    leadForm.elements.page_path.value = window.location.pathname;
    leadNext.value = `${window.location.origin}${window.location.pathname}?status=sucesso`;

    if (pageSearchParams.get("status") === "sucesso") {
        definirStatusDoFormulario(
            "success",
            "Recebemos sua solicitação com sucesso. Em breve nossa equipe entrará em contato."
        );
    }
};

const formatarWhatsapp = inputValue => {
    const digitsOnlyValue = inputValue.replace(/\D/g, "").slice(0, 11);

    if (digitsOnlyValue.length <= 2) {
        return digitsOnlyValue;
    }

    if (digitsOnlyValue.length <= 7) {
        return `(${digitsOnlyValue.slice(0, 2)}) ${digitsOnlyValue.slice(2)}`;
    }

    if (digitsOnlyValue.length <= 10) {
        return `(${digitsOnlyValue.slice(0, 2)}) ${digitsOnlyValue.slice(2, 6)}-${digitsOnlyValue.slice(6)}`;
    }

    return `(${digitsOnlyValue.slice(0, 2)}) ${digitsOnlyValue.slice(2, 7)}-${digitsOnlyValue.slice(7)}`;
};

whatsappField.addEventListener("input", inputEvent => {
    inputEvent.target.value = formatarWhatsapp(inputEvent.target.value);
});

sincronizarMetadadosDaPagina();

let permitirEnvioNativo = false;

leadForm.addEventListener("submit", async submitEvent => {
    if (permitirEnvioNativo) {
        return;
    }

    if (!leadForm.reportValidity()) {
        submitEvent.preventDefault();
        definirStatusDoFormulario("error", "Revise os campos obrigatórios e tente novamente.");
        return;
    }

    submitEvent.preventDefault();
    leadSubmit.disabled = true;
    leadSubmit.innerHTML = '<span class="material-symbols-outlined text-[18px]">hourglass_top</span>Enviando';

    if (window.IP2Icons && typeof window.IP2Icons.upgrade === "function") {
        window.IP2Icons.upgrade(leadSubmit);
    }

    const leadPayload = {
        name: leadForm.elements.nome.value,
        phone: leadForm.elements.whatsapp.value,
        email: leadForm.elements.email.value,
        profile: leadForm.elements.perfil.value,
        planInterest: leadForm.elements.plano_interesse.value
    };

    try {
        if (window.IP2Meta && typeof window.IP2Meta.trackLead === "function") {
            await Promise.race([
                window.IP2Meta.trackLead(leadPayload),
                new Promise(resolve => window.setTimeout(resolve, 800))
            ]);
        }
    } finally {
        permitirEnvioNativo = true;
        leadForm.submit();
    }
});
