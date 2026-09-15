/* --- LÓGICA JAVASCRIPT --- */

// Simulador hipotecario educativo e independiente.
// NO se envían ni almacenan datos personales. Todos los cálculos se ejecutan
// localmente en el navegador del usuario. Las peticiones de red externas
// son a mindicador.cl (HTTPS), con fallback a findic.cl, para obtener el
// valor actual de la UF.

const formatterCLP = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
});

const formatterUF = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

// --- FETCH API UF ---
// Fuente principal: mindicador.cl. Si falla o no responde, fallback a findic.cl.
const UF_API_URL = 'https://mindicador.cl/api';
const UF_API_FALLBACK_URL = 'https://findic.cl/api/uf';
const UF_API_TIMEOUT_MS = 6000;
const UF_FALLBACK_TIMEOUT_MS = 6000;

async function fetchJsonWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Error en la red: ' + response.status);
        return await response.json();
    } finally {
        clearTimeout(timeoutId);
    }
}

async function fetchUFValor() {
    // 1) Intentar mindicador.cl
    try {
        const data = await fetchJsonWithTimeout(UF_API_URL, UF_API_TIMEOUT_MS);
        const valor = data?.uf?.valor;
        if (typeof valor === 'number' && valor > 0) return valor;
    } catch (e) {
        console.warn('mindicador.cl falló, probando fallback findic.cl:', e);
    }
    // 2) Fallback: findic.cl (serie ordenada descendente, primer elemento = valor más reciente)
    const data = await fetchJsonWithTimeout(UF_API_FALLBACK_URL, UF_FALLBACK_TIMEOUT_MS);
    const valor = data?.serie?.[0]?.valor;
    if (typeof valor !== 'number' || valor <= 0) {
        throw new Error('Valor de UF no válido');
    }
    return valor;
}

async function fetchUFValue() {
    const btn = document.getElementById('btnFetchUF');
    const input = document.getElementById('ufValue');
    const originalText = btn.innerText;

    btn.innerText = "Cargando...";
    btn.disabled = true;

    try {
        const valorUF = await fetchUFValor();

        const formattedUF = new Intl.NumberFormat('es-CL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valorUF);

        input.value = formattedUF;

        btn.innerText = "¡Listo!";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.disabled = false;
        }, 1000);

    } catch (error) {
        console.error('Error al obtener UF:', error);
        btn.innerText = "Error al cargar UF";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.disabled = false;
        }, 2000);
    }
}

// --- FORMATO INPUTS ---
function formatCLInput(input) {
    let value = input.value;
    value = value.replace(/[^0-9,]/g, '');
    const parts = value.split(',');
    if (parts.length > 2) {
        value = parts[0] + ',' + parts.slice(1).join('');
    }
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? parts[1] : null;
    
    integerPart = integerPart.replace(/\./g, '');
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    if (decimalPart !== null) {
        decimalPart = decimalPart.substring(0, 2);
    }
    
    if (decimalPart !== null) {
        input.value = `${integerPart},${decimalPart}`;
    } else {
        if (value.endsWith(',')) {
            input.value = `${integerPart},`;
        } else {
            input.value = integerPart;
        }
    }
}

function parseFormattedFloat(value) {
    if (!value) return 0;
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue);
}

// --- CÁLCULO CRÉDITO ---
function calculateMortgage() {
    const ufValue = parseFormattedFloat(document.getElementById('ufValue').value);
    const salary = parseFormattedFloat(document.getElementById('salary').value);
    const propValue = parseFormattedFloat(document.getElementById('propValue').value);
    const downPaymentPercent = parseFloat(document.getElementById('downPayment').value);
    const years = parseFloat(document.getElementById('years').value);
    const cae = parseFloat(document.getElementById('cae').value);

    if (!ufValue || !salary || !propValue || !downPaymentPercent || !years || !cae) {
        alert("Por favor completa todos los campos para realizar el cálculo.");
        return;
    }

    const pieUF = propValue * (downPaymentPercent / 100);
    const pieCLP = pieUF * ufValue;
    const loanUF = propValue - pieUF;
    const loanCLP = loanUF * ufValue;

    const monthlyRate = (cae / 100) / 12;
    const totalMonths = years * 12;
    
    const dividendUF = loanUF * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    const dividendCLP = dividendUF * ufValue;
    const incomeRequired = dividendCLP / 0.25;

    document.getElementById('resYears').innerText = years;
    document.getElementById('resCAE').innerText = cae;
    document.getElementById('resPiePercent').innerText = downPaymentPercent;
    
    document.getElementById('resPieUF').innerText = formatterUF.format(pieUF) + " UF";
    document.getElementById('resPieCLP').innerText = formatterCLP.format(pieCLP);

    document.getElementById('resLoanUF').innerText = formatterUF.format(loanUF) + " UF";
    document.getElementById('resLoanCLP').innerText = formatterCLP.format(loanCLP);

    document.getElementById('resDividendUF').innerText = formatterUF.format(dividendUF) + " UF";
    document.getElementById('resDividendCLP').innerText = formatterCLP.format(dividendCLP);

    document.getElementById('resIncomeReq').innerText = formatterCLP.format(incomeRequired);

    const statusElement = document.getElementById('resIncomeStatus');
    if (salary >= incomeRequired) {
        statusElement.innerHTML = "<span style='color:#34c759'>✓ Tu renta actual es suficiente</span>";
    } else {
        const diff = incomeRequired - salary;
        statusElement.innerHTML = `<span style='color:#ff3b30'>⚠ Faltan ${formatterCLP.format(diff)} en tu renta</span>`;
    }

    const resultsPanel = document.getElementById('resultsPanel');
    resultsPanel.classList.remove('active');
    
    setTimeout(() => {
        resultsPanel.classList.add('active');
    }, 100);
}

// --- LIMPIAR DATOS ---
function clearInputs() {
    document.getElementById('ufValue').value = '';
    document.getElementById('salary').value = '';
    document.getElementById('propValue').value = '';
    document.getElementById('downPayment').value = '';
    document.getElementById('years').value = '';
    document.getElementById('cae').value = '';

    const resultsPanel = document.getElementById('resultsPanel');
    resultsPanel.classList.remove('active');
}