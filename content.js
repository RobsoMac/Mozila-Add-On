(function () {
    'use strict';

    const printerKey = 'brotherPrinterIP';
    const showPopupKey = 'showPopup';

    let serial_index = 0;
    let tags_index = 0;
    let model_index = 0;
    let modelapn_index = 0;
    let type_index = 0;

    function getIndexes() {
        let header_row = document.querySelector('table.table.table-bordered.table-striped.table-condensed thead tr').children;
        for (var i = 0; i < header_row.length; i++) {
            if (header_row[i].innerText.toUpperCase() == "SERIAL ID") { serial_index = i; }
            if (header_row[i].innerText.toUpperCase() == "TAGS") { tags_index = i; }
            if (header_row[i].innerText.toUpperCase() == "MODEL") { model_index = i; }
            if (header_row[i].innerText.toUpperCase() == "MODEL APN") { modelapn_index = i; }
            if (header_row[i].innerText.toUpperCase() == "TYPE") { type_index = i; }
        }
        console.log('Indexes:', { serial_index, tags_index, model_index, modelapn_index, type_index });
    }

    async function getPrinterLabelSize(printerIP) {
        try {
            let response = await fetch(`http://${printerIP}/getLabelSize`);
            let data = await response.json();
            return data.labelSize || "62mm"; // Default to 62mm if unknown
        } catch (error) {
            console.error("Failed to get label size:", error);
            return "62mm"; // Default fallback
        }
    }

    function cleanSerialNumber(serialNumber) {
        return serialNumber.replace(/\s*\( RMA.*?\)\s*/g, '').trim();
    }

    function createLabelLayout(serialNumber, modelNumber, apnNumber, typeName, labelSize) {
        let width = labelSize === "24mm" ? "24mm" : "62mm";
        return `
            <div style="font-family: Arial, sans-serif; font-size: 12px; padding: 10px; width: ${width};">
                <div style="font-weight: bold; font-size: 14px; text-align: center;">Product Label</div>
                <div style="margin-top: 10px;">
                    <div><strong>Serial Number:</strong> ${serialNumber}</div>
                    <div><img src="https://barcode.tec-it.com/barcode.ashx?data=${serialNumber}&code=Code128&dpi=96" alt="Barcode"></div>
                    <div><img src="https://api.qrserver.com/v1/create-qr-code/?data=${serialNumber}&size=100x100" alt="QR Code"></div>
                    <div><strong>Model Number:</strong> ${modelNumber}</div>
                    <div><strong>APN Number:</strong> ${apnNumber}</div>
                    <div><strong>Type:</strong> ${typeName}</div>
                </div>
            </div>
        `;
    }

    function createPrintButton(serialNumber, modelNumber, apnNumber, typeName) {
        var printButton = document.createElement("button");
        printButton.innerText = "Print 🖨️";
        printButton.style.backgroundColor = "rgb(49, 70, 94)";
        printButton.style.border = "1px solid rgb(255, 255, 255)";
        printButton.style.height = "36px";
        printButton.style.color = "white";
        printButton.style.padding = "4px 12px";
        printButton.style.textAlign = "center";
        printButton.style.textDecoration = "none";
        printButton.style.display = "inline-block";
        printButton.style.fontSize = "14px";
        printButton.style.fontWeight = "bold";
        printButton.style.margin = "2px";
        printButton.style.cursor = "pointer";
        printButton.style.borderRadius = "6px";
        printButton.style.transition = "background-color 0.3s, box-shadow 0.3s";
        printButton.style.boxShadow = "rgba(0, 0, 0, 0.2) 0px 4px 5px";
        
        // Load Saved Printer IP
        printButton.addEventListener("click", async () => {
            const printerIP = localStorage.getItem(printerKey);
            if (!printerIP) {
                alert("Please set the Printer IP first!");
                return;
            }

            let labelSize = await getPrinterLabelSize(printerIP);
            let cleanedSerialNumber = cleanSerialNumber(serialNumber);
            let labelLayout = createLabelLayout(cleanedSerialNumber, modelNumber, apnNumber, typeName, labelSize);

            fetch(`http://localhost:3000/label`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ printerIP, serialNumber: cleanedSerialNumber, modelNumber, apnNumber, typeName, labelSize, labelLayout })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    showSuccessTick(printButton);
                } else {
                    alert("Failed to send print job.");
                }
            })
            .catch((error) => {
                console.error("Failed to connect to print server:", error);
                alert("Failed to connect to print server.");
            });
        });

        return printButton;
    }

    // Function to temporarily change the button content to a green tick emoji for 1 second
    const showSuccessTick = (button) => {
        button.textContent = '✔️'; // Change button content to green tick emoji
        setTimeout(() => {
            button.textContent = 'Print 🖨️'; // Change button content back to print symbol after 1 second
        }, 1000);
    };

    function addPrintButtons() {
        document.querySelectorAll("tbody tr").forEach(row => {
            let targetCell = row.cells[3]; // 4th <td> (zero-based index)
            if (targetCell && !targetCell.querySelector(".print-button")) {
                let serialNumber = row.cells[serial_index]?.innerText.trim() || "Unknown";
                let modelNumber = row.cells[model_index]?.innerText.trim() || "Unknown";
                let apnNumber = row.cells[modelapn_index]?.innerText.trim() || "Unknown";
                let typeName = row.cells[type_index]?.innerText.trim() || "Unknown";

                let printButton = createPrintButton(serialNumber, modelNumber, apnNumber, typeName);
                printButton.classList.add("print-button");
                targetCell.appendChild(printButton);
            }
        });
    }

    // Add input box for Printer IP/Name
    const printerInputBox = document.createElement("div");
    printerInputBox.style = "display: inline-block; margin-left: 5px;";
    printerInputBox.innerHTML = `
        <label for="printer-ip">Printer IP/Name:</label>
        <input id="printer-ip" type="text" placeholder="Enter Printer IP" style="margin-left: 1px;" />
        <button id="save-printer-ip" style="background-color: rgb(49, 70, 94); border: 1px solid rgb(255, 255, 255); height: 30px; color: white; padding: 4px 12px; text-align: center; text-decoration: none; display: inline-block; font-size: 12px; font-weight: bold; margin: 0px; cursor: pointer; border-radius: 6px; transition: background-color 0.3s, box-shadow 0.3s; box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 0px;">Save</button>
    `;
    document.querySelector('a[href="https://w.amazon.com/bin/view/DataCenterSystems/Mobility/Project/SMASHSearchAPI/NewGuide/"]').insertAdjacentElement('afterend', printerInputBox);

    document.getElementById("printer-ip").value = localStorage.getItem(printerKey) || "";
    document.getElementById("save-printer-ip").addEventListener("click", () => {
        const printerIP = document.getElementById("printer-ip").value.trim();
        localStorage.setItem(printerKey, printerIP);
        alert("Printer IP saved!");
        localStorage.setItem(showPopupKey, "false");
    });

    let observer = new MutationObserver(() => {
        if (document.querySelector("tbody tr")) {
            observer.disconnect();
            getIndexes();
            addPrintButtons();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    async function checkServerStatus() {
        try {
            const response = await fetch("http://localhost:3000");
            if (response.ok) {
                console.log("Server is running.");
                return true;
            }
        } catch (error) {
            console.log("Server is not running.");
        }
        return false;
    }

    async function showPopupIfServerNotRunning() {
        const showPopup = localStorage.getItem(showPopupKey) !== "false";
        if (!showPopup) return;

        const serverRunning = await checkServerStatus();
        if (!serverRunning) {
            const popup = document.createElement("div");
            popup.style = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: var(--bg-color); padding: 20px; border: 1px solid var(--text-color); z-index: 1000; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5); border-radius: 10px;";
            popup.innerHTML = `
                <h2 style="margin-top: 0; color: var(--text-color);">Print Server Not Running</h2>
                <p style="color: var(--text-color);">The local print server is not running. Please download and run the print_server executable.</p>
                <a href="https://drive.corp.amazon.com/documents/macrobso@/print_server.exe" download style="color: blue; text-decoration: underline;">Download Print Server</a>
                <div style="margin-top: 10px;">
                    <input type="checkbox" id="dont-show-again" />
                    <label for="dont-show-again" style="color: var(--text-color);">Don't show this again</label>
                </div>
                <button id="close-popup" style="margin-top: 10px; background-color: rgb(49, 70, 94); color: white; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px;">Close</button>
            `;
            document.body.appendChild(popup);

            document.getElementById("close-popup").addEventListener("click", () => {
                if (document.getElementById("dont-show-again").checked) {
                    localStorage.setItem(showPopupKey, "false");
                }
                document.body.removeChild(popup);
            });
        }
    }

    // Detect system theme and set initial theme
    function detectSystemTheme() {
        const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDarkScheme ? 'dark' : 'light');
    }

    // Listen for changes in the system theme
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', (e) => {
        setTheme(e.matches ? 'dark' : 'light');
    });

    // Set the initial theme based on system preference
    detectSystemTheme();

    showPopupIfServerNotRunning();

    function setTheme(theme) {
        let root = document.documentElement;
        if (theme === 'light') {
            root.style.setProperty('--bg-color', '#ECF2FF');
            root.style.setProperty('--text-color', '#2B283A');
            root.style.setProperty('--title-color', '#4A4E74');
        } else if (theme === 'dark') {
            root.style.setProperty('--bg-color', '#2B283A');
            root.style.setProperty('--text-color', '#ECF2FF');
            root.style.setProperty('--title-color', '#D5D4D8');
        }
    }
})();