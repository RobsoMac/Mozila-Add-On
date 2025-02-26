browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'print') {
        sendPrintJob(request.data)
            .then(() => sendResponse({ status: 'Print job sent' }))
            .catch((error) => {
                console.error("Failed to send print job:", error);
                sendResponse({ status: 'Failed to send print job' });
            });
        return true; // Ensures the response is sent asynchronously
    } else if (request.action === 'launchPrinterMonitor') {
        browser.runtime.sendNativeMessage("com.brother.printer", {}, (response) => {
            if (browser.runtime.lastError) {
                console.error(browser.runtime.lastError);
                sendResponse({ success: false, error: browser.runtime.lastError.message });
            } else {
                sendResponse({ success: true, response });
            }
        });
        return true; // Keep the message channel open for sendResponse
    }
});

async function sendPrintJob(data) {
    console.log('Sending print job:', data);
    try {
        const response = await fetch("http://localhost:3000/print", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }
    } catch (error) {
        console.error("Print request failed:", error);
        throw error;
    }
}