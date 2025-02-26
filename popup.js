document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById("printer-ip");
    browser.storage.local.get("printerIP", (data) => {
        input.value = data.printerIP || "";
    });

    document.getElementById("save-printer-ip").addEventListener("click", () => {
        const printerIP = input.value.trim();
        browser.storage.local.set({ printerIP }, () => {
            alert("Printer IP saved!");
        });
    });
});