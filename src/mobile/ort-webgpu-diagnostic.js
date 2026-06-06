const ORT_WEB_VERSION = '1.26.0';
const ORT_WEB_BASE_URL = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_WEB_VERSION}`;
const WEBGPU_IMPORT_URL = `${ORT_WEB_BASE_URL}/webgpu/+esm`;
const WASM_IMPORT_URL = `${ORT_WEB_BASE_URL}/+esm`;
const ORT_WASM_MJS_URL = `${ORT_WEB_BASE_URL}/dist/ort-wasm-simd-threaded.asyncify.mjs`;
const ORT_WASM_BINARY_URL = `${ORT_WEB_BASE_URL}/dist/ort-wasm-simd-threaded.asyncify.wasm`;
const MODEL_BASE64 = [
  'CAMSDGJhY2tlbmQtdGVzdDpiChEKAWEKAWISAWMiBk1hdE11bBIOdGVzdF9tYXRtdWxfMmRaEwoBYRIO',
  'CgwIARIICgIIAwoCCARaEwoBYhIOCgwIARIICgIIBAoCCANiEwoBYxIOCgwIARIICgIIAwoCCANCAhAJ',
].join('');

const MODEL_BYTES = base64ToUint8Array(MODEL_BASE64);
const EXPECTED_OUTPUT = Float32Array.from([
  700, 800, 900,
  1580, 1840, 2100,
  2460, 2880, 3300,
]);
const INPUT_A = Float32Array.from([
  1, 2, 3, 4,
  5, 6, 7, 8,
  9, 10, 11, 12,
]);
const INPUT_B = Float32Array.from([
  10, 20, 30,
  40, 50, 60,
  70, 80, 90,
  100, 110, 120,
]);

const runWebGpuButton = document.querySelector('#run-webgpu-button');
const runWasmButton = document.querySelector('#run-wasm-button');
const runStatus = document.querySelector('#run-status');
const capSecureContext = document.querySelector('#cap-secure-context');
const capNavigatorGpu = document.querySelector('#cap-navigator-gpu');
const capAdapter = document.querySelector('#cap-adapter');
const capShaderF16 = document.querySelector('#cap-shader-f16');
const capUserAgent = document.querySelector('#cap-user-agent');
const capAdapterInfo = document.querySelector('#cap-adapter-info');
const summaryEp = document.querySelector('#summary-ep');
const summaryVersion = document.querySelector('#summary-version');
const summarySessionMs = document.querySelector('#summary-session-ms');
const summaryRunMs = document.querySelector('#summary-run-ms');
const summaryVerified = document.querySelector('#summary-verified');
const summaryModelSize = document.querySelector('#summary-model-size');
const summaryBanner = document.querySelector('#summary-banner');
const expectedOutput = document.querySelector('#expected-output');
const actualOutput = document.querySelector('#actual-output');
const logList = document.querySelector('#log-list');

runWebGpuButton.addEventListener('click', () => runDiagnostic('webgpu'));
runWasmButton.addEventListener('click', () => runDiagnostic('wasm'));

expectedOutput.value = formatMatrix(EXPECTED_OUTPUT, [3, 3]);
populateCapabilitySnapshot();

async function runDiagnostic(executionProvider) {
  setBusy(true);
  clearLog();
  actualOutput.value = '';
  summaryEp.textContent = executionProvider;
  summaryVersion.textContent = '-';
  summarySessionMs.textContent = '-';
  summaryRunMs.textContent = '-';
  summaryVerified.textContent = '-';
  summaryModelSize.textContent = `${MODEL_BYTES.byteLength} bytes`;
  summaryBanner.textContent = `Running ${executionProvider} diagnostic…`;
  runStatus.textContent = `Running tiny ONNX matmul with ${executionProvider}…`;

  try {
    const capability = await collectCapabilitySnapshot();
    renderCapabilitySnapshot(capability);
    logInfo(`Secure context: ${capability.secureContext ? 'yes' : 'no'}`);
    logInfo(`navigator.gpu: ${capability.hasNavigatorGpu ? 'available' : 'missing'}`);
    if (executionProvider === 'webgpu' && !capability.hasNavigatorGpu) {
      throw new Error('navigator.gpu is not available, so a direct WebGPU session cannot be created in this browser.');
    }

    const importUrl = executionProvider === 'webgpu' ? WEBGPU_IMPORT_URL : WASM_IMPORT_URL;
    logInfo(`Importing ONNX Runtime from ${importUrl}`);
    const ort = await import(importUrl);
    summaryVersion.textContent = ort.version || 'unknown';
    logSuccess(`Imported ONNX Runtime ${ort.version || 'unknown'}.`);

    if (ort.env?.wasm) {
      ort.env.wasm.proxy = false;
      ort.env.wasm.wasmPaths = {
        mjs: ORT_WASM_MJS_URL,
        wasm: ORT_WASM_BINARY_URL,
      };
      logInfo(`Configured wasm helper assets: ${ORT_WASM_MJS_URL}`);
    }

    const sessionOptions = {
      executionProviders: [executionProvider],
      logSeverityLevel: 0,
    };

    const sessionStart = performance.now();
    const session = await ort.InferenceSession.create(MODEL_BYTES.slice(), sessionOptions);
    const sessionMs = performance.now() - sessionStart;
    summarySessionMs.textContent = formatDuration(sessionMs);
    logSuccess(`Session created in ${formatDuration(sessionMs)}.`);
    logInfo(`Inputs: ${session.inputNames.join(', ')} | Outputs: ${session.outputNames.join(', ')}`);

    const feeds = {
      a: new ort.Tensor('float32', INPUT_A, [3, 4]),
      b: new ort.Tensor('float32', INPUT_B, [4, 3]),
    };
    const runStart = performance.now();
    const results = await session.run(feeds);
    const runMs = performance.now() - runStart;
    summaryRunMs.textContent = formatDuration(runMs);
    logSuccess(`Inference finished in ${formatDuration(runMs)}.`);

    const outputName = session.outputNames[0] || 'c';
    const outputTensor = results[outputName] || results.c;
    if (!outputTensor) {
      throw new Error('Model run completed, but no output tensor was returned.');
    }

    actualOutput.value = formatMatrix(outputTensor.data, outputTensor.dims || [3, 3]);
    const verified = arraysAlmostEqual(outputTensor.data, EXPECTED_OUTPUT, 1e-4);
    summaryVerified.textContent = verified ? 'match' : 'mismatch';
    summaryBanner.textContent = verified
      ? `${executionProvider} diagnostic succeeded and produced the expected output.`
      : `${executionProvider} ran, but the output tensor did not match the expected values.`;

    if (verified) {
      logSuccess('Output tensor matches the expected matmul result.');
    } else {
      logError('Output tensor mismatch detected.');
    }

    await session.release?.();
    runStatus.textContent = `Finished ${executionProvider} diagnostic.`;
  } catch (error) {
    console.error(error);
    summaryVerified.textContent = 'failed';
    summaryBanner.textContent = `${executionProvider} diagnostic failed: ${formatError(error)}`;
    runStatus.textContent = `Failed ${executionProvider} diagnostic.`;
    logError(formatError(error));
  } finally {
    setBusy(false);
  }
}

async function populateCapabilitySnapshot() {
  const capability = await collectCapabilitySnapshot();
  renderCapabilitySnapshot(capability);
}

async function collectCapabilitySnapshot() {
  const capability = {
    secureContext: window.isSecureContext,
    hasNavigatorGpu: typeof navigator.gpu !== 'undefined',
    adapterAvailable: false,
    shaderF16: false,
    userAgent: navigator.userAgent,
    adapterInfo: 'Unavailable',
  };

  if (!capability.hasNavigatorGpu) {
    return capability;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    capability.adapterAvailable = Boolean(adapter);
    if (!adapter) {
      capability.adapterInfo = 'No GPU adapter returned by navigator.gpu.requestAdapter().';
      return capability;
    }

    capability.shaderF16 = adapter.features.has('shader-f16');
    capability.adapterInfo = await formatAdapterInfo(adapter);
  } catch (error) {
    capability.adapterInfo = `Adapter query failed: ${formatError(error)}`;
  }

  return capability;
}

async function formatAdapterInfo(adapter) {
  const infoLines = [];

  try {
    if (typeof adapter.requestAdapterInfo === 'function') {
      const info = await adapter.requestAdapterInfo();
      infoLines.push(`Vendor: ${info.vendor || 'unknown'}`);
      infoLines.push(`Architecture: ${info.architecture || 'unknown'}`);
      infoLines.push(`Device: ${info.device || 'unknown'}`);
      infoLines.push(`Description: ${info.description || 'unknown'}`);
    } else if (adapter.info) {
      infoLines.push(`Vendor: ${adapter.info.vendor || 'unknown'}`);
      infoLines.push(`Architecture: ${adapter.info.architecture || 'unknown'}`);
      infoLines.push(`Device: ${adapter.info.device || 'unknown'}`);
      infoLines.push(`Description: ${adapter.info.description || 'unknown'}`);
    }
  } catch (error) {
    infoLines.push(`Adapter info unavailable: ${formatError(error)}`);
  }

  const featureList = Array.from(adapter.features.values()).sort();
  if (featureList.length) {
    infoLines.push(`Features: ${featureList.join(', ')}`);
  }

  const interestingLimits = [
    'maxBufferSize',
    'maxStorageBufferBindingSize',
    'maxComputeInvocationsPerWorkgroup',
    'maxComputeWorkgroupStorageSize',
  ];
  const presentLimits = interestingLimits
    .filter((name) => typeof adapter.limits?.[name] !== 'undefined')
    .map((name) => `${name}: ${adapter.limits[name]}`);
  if (presentLimits.length) {
    infoLines.push(`Limits: ${presentLimits.join(', ')}`);
  }

  return infoLines.join('\n') || 'Adapter available, but no extra information was exposed.';
}

function renderCapabilitySnapshot(capability) {
  capSecureContext.textContent = capability.secureContext ? 'yes' : 'no';
  capNavigatorGpu.textContent = capability.hasNavigatorGpu ? 'yes' : 'no';
  capAdapter.textContent = capability.adapterAvailable ? 'available' : 'unavailable';
  capShaderF16.textContent = capability.shaderF16 ? 'supported' : 'not reported';
  capUserAgent.value = capability.userAgent;
  capAdapterInfo.value = capability.adapterInfo;
}

function setBusy(isBusy) {
  runWebGpuButton.disabled = isBusy;
  runWasmButton.disabled = isBusy;
}

function clearLog() {
  logList.innerHTML = '';
}

function logInfo(message) {
  appendLog('info', message);
}

function logSuccess(message) {
  appendLog('success', message);
}

function logError(message) {
  appendLog('error', message);
}

function appendLog(level, message) {
  const item = document.createElement('li');
  item.className = `log-entry ${level}`;
  const label = level === 'error' ? 'Error' : level === 'success' ? 'OK' : 'Info';
  item.innerHTML = `<strong>${label}</strong><span>${escapeHtml(message)}</span>`;
  logList.appendChild(item);
}

function formatDuration(milliseconds) {
  return `${milliseconds.toFixed(1)} ms`;
}

function formatMatrix(data, dims) {
  const rows = dims?.[0] || 1;
  const cols = dims?.[1] || data.length;
  const lines = [];
  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const start = rowIndex * cols;
    const row = Array.from(data.slice(start, start + cols), (value) => Number(value).toFixed(1));
    lines.push(`[${row.join(', ')}]`);
  }
  return lines.join('\n');
}

function arraysAlmostEqual(actual, expected, tolerance) {
  if (!actual || actual.length !== expected.length) {
    return false;
  }

  for (let index = 0; index < actual.length; index += 1) {
    if (Math.abs(Number(actual[index]) - Number(expected[index])) > tolerance) {
      return false;
    }
  }

  return true;
}

function base64ToUint8Array(base64) {
  const binary = atob(base64.replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function formatError(error) {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  return String(error);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}