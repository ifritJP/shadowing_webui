import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

const bundleInput = document.querySelector('#bundle-input');
const bundleStatus = document.querySelector('#bundle-status');
const asrEngine = document.querySelector('#asr-engine');
const engineStatus = document.querySelector('#engine-status');
const ossModelPanel = document.querySelector('#oss-model-panel');
const modelBundleInput = document.querySelector('#model-bundle-input');
const modelStatus = document.querySelector('#model-status');
const modelMeta = document.querySelector('#model-meta');
const modelId = document.querySelector('#model-id');
const modelDevice = document.querySelector('#model-device');
const modelDtype = document.querySelector('#model-dtype');
const modelFileCount = document.querySelector('#model-file-count');
const loadModelButton = document.querySelector('#load-model-button');
const modelUrlInput = document.querySelector('#model-url-input');
const loadModelUrlButton = document.querySelector('#load-model-url-button');
const modelSourceSelect = document.querySelector('#model-source-select');
const modelSourceBundleContainer = document.querySelector('#model-source-bundle-container');
const modelSourceHfContainer = document.querySelector('#model-source-hf-container');
const modelHfSelect = document.querySelector('#model-hf-select');
const modelHfCustomInput = document.querySelector('#model-hf-custom-input');
const loadModelHfButton = document.querySelector('#load-model-hf-button');
const saveModelZipButton = document.querySelector('#save-model-zip-button');
const downloadedHfFiles = new Map();
let activeHfModelId = null;
let lastActiveTrimmedAudio = null;
const bundlePanel = document.querySelector('#bundle-panel');
const bundleLanguage = document.querySelector('#bundle-language');
const bundleModel = document.querySelector('#bundle-model');
const sourceText = document.querySelector('#source-text');
const referenceAudio = document.querySelector('#reference-audio');
const transcribeReferenceButton = document.querySelector('#transcribe-reference-button');
const recordButton = document.querySelector('#record-button');
const stopButton = document.querySelector('#stop-button');
const transcribeButton = document.querySelector('#transcribe-button');
const recordingStatus = document.querySelector('#recording-status');
const recordedAudio = document.querySelector('#recorded-audio');
const originalAudioWrapper = document.querySelector('#original-audio-wrapper');
const trimmedRecordedAudio = document.querySelector('#trimmed-recorded-audio');
const trimmedAudioWrapper = document.querySelector('#trimmed-audio-wrapper');
const transcriptText = document.querySelector('#transcript-text');
const runtimePanel = document.querySelector('#runtime-panel');
const runtimeEngine = document.querySelector('#runtime-engine');
const runtimeBackend = document.querySelector('#runtime-backend');
const runtimeLoad = document.querySelector('#runtime-load');
const runtimeTranscribe = document.querySelector('#runtime-transcribe');
const runtimeDecode = document.querySelector('#runtime-decode');
const runtimeModel = document.querySelector('#runtime-model');
const runtimePost = document.querySelector('#runtime-post');
const scorePanel = document.querySelector('#score-panel');
const scoreValue = document.querySelector('#score-value');
const scoreNote = document.querySelector('#score-note');
const clearStorageButton = document.querySelector('#clear-storage-button');
const storageListContainer = document.querySelector('#storage-list-container');
const compareTextButton = document.querySelector('#compare-text-button');
const asrProgressContainer = document.querySelector('#asr-progress-container');
const asrProgressText = document.querySelector('#asr-progress-text');
const autoAsrCheckbox = document.querySelector('#auto-asr-checkbox');
const autoCompareCheckbox = document.querySelector('#auto-compare-checkbox');
const showSourceCheckbox = document.querySelector('#show-source-checkbox');
const micSelect = document.querySelector('#mic-select');
const speakerSelect = document.querySelector('#speaker-select');
const startPracticeBtn = document.querySelector('#start-practice-btn');
const debugLogConsole = document.querySelector('#debug-log-console');
const clearDebugLogBtn = document.querySelector('#clear-debug-log-btn');

function addDebugLog(msg) {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
  const line = `[${timeStr}] ${msg}\n`;
  console.log(line.trim());
  if (debugLogConsole) {
    debugLogConsole.textContent += line;
    debugLogConsole.scrollTop = debugLogConsole.scrollHeight;
  }
}

if (clearDebugLogBtn) {
  clearDebugLogBtn.addEventListener('click', () => {
    if (debugLogConsole) {
      debugLogConsole.textContent = '';
    }
  });
}

const ttsTextInput = document.querySelector('#tts-text-input');
const ttsRefAudioInput = document.querySelector('#tts-ref-audio-input');
const ttsStatus = document.querySelector('#tts-status');
const generateBundleButton = document.querySelector('#generate-bundle-button');
const generateAllGradeButton = document.querySelector('#generate-all-grade-button');
const ttsLevelSelect = document.querySelector('#tts-level-select');
const ttsPhraseSelect = document.querySelector('#tts-phrase-select');
const ttsDetails = document.querySelector('#tts-details');
const ttsOfflineMessage = document.querySelector('#tts-offline-message');

const ttsQueueContainer = document.querySelector('#tts-queue-container');
const ttsQueueCount = document.querySelector('#tts-queue-count');
const ttsQueueList = document.querySelector('#tts-queue-list');
const createBundleButton = document.querySelector('#create-bundle-button');
const bundleItemSelectorContainer = document.querySelector('#bundle-item-selector-container');
const bundleItemSelect = document.querySelector('#bundle-item-select');

let generatedQueue = [];

const GRADE_PHRASES = {
  jhs1: [
    "Hi there. I love playing soccer. Let's play together sometime.",
    "This is my dog, Pochi. He can run really fast. Look at him go.",
    "Do you have any pets? I have a cute little cat at home.",
    "I usually wake up early. Then, I walk to school with my friends.",
    "What do you want for lunch? I really want to eat pizza today."
  ],
  jhs2: [
    "I went to Tokyo last weekend. I bought some delicious sweets for you. I hope you will like them.",
    "I'm going to visit Kyoto next summer. I want to see the old temples there. It's going to be so much fun.",
    "Playing tennis is really fun, but it's not that easy. I need to practice a lot more with my team.",
    "We have a big English test tomorrow. I must study hard tonight. I want to get a good grade this time.",
    "My uncle lives in Canada. He speaks English so well. I really want to visit his place someday."
  ],
  jhs3: [
    "I've lived in Osaka for three years now. I have made many good friends here. They always help me out whenever I'm in trouble.",
    "This is the comic book that I bought yesterday. It's so funny. You should borrow it when you have some free time.",
    "English is spoken by people all over the world. It's a very useful language. I hope to study abroad and make friends from different countries.",
    "Excuse me, do you know where the nearest convenience store is? I need to buy some drinks and snacks. I'm feeling a bit hungry.",
    "I want to visit a country that has beautiful beaches. I love swimming in the ocean. It always makes me feel so relaxed and happy."
  ],
  hs1: [
    "If I had enough money, I would buy that new laptop. My current one is getting too slow to run my favorite games. I really need a faster one for my online coding classes.",
    "I happened to run into an old classmate of mine on the street yesterday. We hadn't seen each other since junior high school graduation. We ended up chatting for hours at a nearby coffee shop.",
    "This is the town where I was born and grew up. It has changed quite a bit since I was a child, but the cozy atmosphere is still the same. I really love this place.",
    "Whatever you choose to do after graduation, I will always support you. The most important thing is to do what you love. Don't worry too much about making mistakes along the way.",
    "I think it's important for us to reduce plastic waste in our daily lives. We can start by carrying our own water bottles. Even small changes can make a big difference if everyone helps out."
  ],
  hs2: [
    "You should have told me you were coming to town this weekend. We could have planned a nice dinner together with the rest of our friends. Let me know early next time so we can hang out.",
    "If I had started preparing for the speech contest a bit earlier, I could have done much better. I was so nervous that I forgot half of my lines. I definitely need to practice speaking in public more often.",
    "Social media has changed the way we communicate with each other. While it's great for staying in touch with friends far away, it can also take up too much of our time. We should try to balance our online and offline lives.",
    "I found it pretty hard to adjust to my new school at first. Everything felt so unfamiliar, and I didn't know anyone. But after joining the basketball club, I quickly made some really close friends.",
    "My parents are planning to renovate our living room next month. They want to make it more spacious and comfortable for family gatherings. I'm looking forward to helping them choose the new furniture and wall colors."
  ],
  hs3: [
    "Not only did she finish the difficult assignment ahead of schedule, but she also helped me fix my code. Her support was a lifesaver, and I couldn't have finished it without her. We celebrated our success with a huge pizza afterward. She is definitely the best study partner.",
    "It was my high school teacher's advice that made me decide to major in chemistry. Before that talk, I had no idea what I wanted to do in the future. Now, I'm really excited about doing research in the lab. I hope to develop something useful someday.",
    "Some studies show that listening to instrumental music can actually help you concentrate while studying. It seems to block out distracting background noises and keep your brain focused. I always put on my headphones when I write essays. You should give it a try next time.",
    "Had I checked the weather forecast this morning, I wouldn't have left my umbrella at home. It started pouring right after I walked out of the station, and I got completely soaked. I'll make sure to double-check the weather app from now on.",
    "With the summer vacation just around the corner, everyone in my class is busy planning trips. Some are going to the beach, while others prefer relaxing in the mountains. I'm going to visit my grandparents in Hokkaido with my family. I can't wait to eat some delicious seafood."
  ]
};

const DB_NAME = 'StudyLangDB';
const DB_VERSION = 1;
const STORE_NAME = 'bundles';

const UPLOADED_MODEL_ROOT = '/__study_lang_uploaded_models__/';
const DEFAULT_TRANSFORMERS_JS_VERSION = '3.8.1';
const TRANSFORMERS_JS_VERSION = resolveTransformersJsVersion();
const TRANSFORMERS_JS_CDN = `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${encodeURIComponent(TRANSFORMERS_JS_VERSION)}/+esm`;

let activeBundle = null;
let activeModelBundle = null;
let loadedLocalAsr = null;
let recognition = null;
let mediaRecorder = null;
let mediaStream = null;
let silentAudioContext = null;
let silentOscillator = null;
let recordedChunks = [];
let recordedBlob = null;
let recognitionFinalText = '';
let transformersModulePromise = null;
let originalWindowFetch = null;

bundleInput.addEventListener('change', handleBundleUpload);
generateBundleButton.addEventListener('click', handleGenerateBundle);
generateAllGradeButton.addEventListener('click', handleGenerateAllGradePhrases);
createBundleButton.addEventListener('click', createBundleFromQueue);
bundleItemSelect.addEventListener('change', handleBundleItemChange);
ttsLevelSelect.addEventListener('change', updateTtsPhraseOptions);
ttsPhraseSelect.addEventListener('change', () => {
  ttsTextInput.value = ttsPhraseSelect.value;
});
ttsRefAudioInput.addEventListener('change', handleTtsRefAudioChange);
asrEngine.addEventListener('change', handleEngineChange);
modelBundleInput.addEventListener('change', handleModelBundleUpload);
loadModelButton.addEventListener('click', loadUploadedOssModel);
loadModelUrlButton.addEventListener('click', handleModelUrlLoad);
loadModelHfButton.addEventListener('click', loadUploadedOssModel);
saveModelZipButton.addEventListener('click', saveHfModelAsZip);
modelSourceSelect.addEventListener('change', () => {
  const val = modelSourceSelect.value;
  if (val === 'huggingface') {
    modelSourceBundleContainer.hidden = true;
    modelSourceHfContainer.hidden = false;
    loadModelButton.disabled = false;
    modelStatus.textContent = 'Ready to download/load remote model from Hugging Face.';
    if (downloadedHfFiles.size > 0) {
      saveModelZipButton.style.display = 'block';
    } else {
      saveModelZipButton.style.display = 'none';
    }
  } else {
    modelSourceBundleContainer.hidden = false;
    modelSourceHfContainer.hidden = true;
    loadModelButton.disabled = !activeModelBundle;
    modelStatus.textContent = activeModelBundle ? 'Model bundle ready.' : 'Upload a model ZIP or specify a URL to load.';
    saveModelZipButton.style.display = 'none';
  }
});
clearStorageButton.addEventListener('click', handleClearStorage);
transcribeReferenceButton.addEventListener('click', transcribeReferenceAudio);
recordButton.addEventListener('click', startPracticeCapture);
stopButton.addEventListener('click', stopPracticeCapture);
transcribeButton.addEventListener('click', transcribeRecording);
compareTextButton.addEventListener('click', renderComparison);
startPracticeBtn.addEventListener('click', handleStartPractice);
storageListContainer.addEventListener('click', handleStorageItemClick);

// Load options from localStorage
autoAsrCheckbox.checked = localStorage.getItem('study_lang_auto_asr') === 'true';
autoCompareCheckbox.checked = localStorage.getItem('study_lang_auto_compare') === 'true';
const storedShowSource = localStorage.getItem('study_lang_show_source');
showSourceCheckbox.checked = storedShowSource === null ? true : storedShowSource === 'true';
updateSourceVisibility();

autoAsrCheckbox.addEventListener('change', () => {
  localStorage.setItem('study_lang_auto_asr', autoAsrCheckbox.checked);
});
autoCompareCheckbox.addEventListener('change', () => {
  localStorage.setItem('study_lang_auto_compare', autoCompareCheckbox.checked);
});
showSourceCheckbox.addEventListener('change', () => {
  localStorage.setItem('study_lang_show_source', showSourceCheckbox.checked);
  updateSourceVisibility();
});

function updateSourceVisibility() {
  sourceText.hidden = !showSourceCheckbox.checked;
}

micSelect.addEventListener('change', () => {
  localStorage.setItem('study_lang_selected_mic', micSelect.value);
});

speakerSelect.addEventListener('change', () => {
  updateSpeaker(speakerSelect.value);
});

// Debug audio events for referenceAudio
if (referenceAudio) {
  referenceAudio.addEventListener('play', () => addDebugLog('referenceAudio event: play'));
  referenceAudio.addEventListener('playing', () => addDebugLog('referenceAudio event: playing'));
  referenceAudio.addEventListener('pause', () => addDebugLog('referenceAudio event: pause'));
  referenceAudio.addEventListener('ended', () => addDebugLog('referenceAudio event: ended'));
  referenceAudio.addEventListener('error', (e) => addDebugLog(`referenceAudio event: error (${referenceAudio.error?.message || 'unknown error'})`));
}

async function updateSpeaker(speakerId) {
  try {
    if (typeof referenceAudio.setSinkId === 'function') {
      await referenceAudio.setSinkId(speakerId);
      console.log(`Audio output sink set to ${speakerId} for reference audio`);
    }
    if (typeof recordedAudio.setSinkId === 'function') {
      await recordedAudio.setSinkId(speakerId);
      console.log(`Audio output sink set to ${speakerId} for recorded audio`);
    }
    localStorage.setItem('study_lang_selected_speaker', speakerId);
  } catch (err) {
    console.error('Failed to set audio output device (sinkId):', err);
  }
}

async function updateAudioDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return;
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // Build Microphone dropdown
    const audioInputs = devices.filter(d => d.kind === 'audioinput');
    micSelect.innerHTML = '';
    const defaultMicOpt = document.createElement('option');
    defaultMicOpt.value = '';
    defaultMicOpt.textContent = 'Default microphone';
    micSelect.appendChild(defaultMicOpt);
    
    const storedMic = localStorage.getItem('study_lang_selected_mic') || '';
    audioInputs.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Microphone ${index + 1} (${device.deviceId.substring(0, 5) || 'unknown'}...)`;
      if (device.deviceId === storedMic) {
        option.selected = true;
      }
      micSelect.appendChild(option);
    });

    // Build Speaker dropdown
    const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
    speakerSelect.innerHTML = '';
    const defaultSpkOpt = document.createElement('option');
    defaultSpkOpt.value = '';
    defaultSpkOpt.textContent = 'Default speaker';
    speakerSelect.appendChild(defaultSpkOpt);

    const storedSpeaker = localStorage.getItem('study_lang_selected_speaker') || '';
    audioOutputs.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Speaker ${index + 1} (${device.deviceId.substring(0, 5) || 'unknown'}...)`;
      if (device.deviceId === storedSpeaker) {
        option.selected = true;
      }
      speakerSelect.appendChild(option);
    });

    // Apply stored speaker on load
    if (storedSpeaker) {
      await updateSpeaker(storedSpeaker);
    }
  } catch (err) {
    console.warn('Failed to enumerate audio devices:', err);
  }
}

handleEngineChange();
updateTtsPhraseOptions();
initAppStorage();
checkTtsApiAvailability();
updateAudioDevices();

async function handleBundleUpload(event) {
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  bundleStatus.textContent = 'Loading bundle…';

  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    console.log('Saving study bundle File object to IndexedDB...');
    await saveToIndexedDB('studyBundle', { name: file.name, data: file });
    resetBundleView();
    await processStudyBundle(arrayBuffer, 'uploaded');
    await refreshStorageList();
  } catch (error) {
    console.error(error);
    bundleStatus.textContent = error.message;
  }
}

async function handleGenerateBundle() {
  const text = ttsTextInput.value.trim();
  if (!text) {
    ttsStatus.textContent = 'Please enter a phrase text to synthesize.';
    return;
  }

  const formData = new FormData();
  formData.append('text', text);

  const [refAudioFile] = ttsRefAudioInput.files ?? [];
  if (refAudioFile) {
    formData.append('ref_audio', refAudioFile);
  }

  ttsStatus.textContent = 'Generating study bundle via backend Qwen-TTS...';
  generateBundleButton.disabled = true;

  try {
    const response = await fetch('/api/generate-bundle', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorMsg = await response.text().catch(() => response.statusText);
      throw new Error(`Server returned error: ${response.status} - ${errorMsg}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // ZIPを展開してデータを取り出す
    const zip = await JSZip.loadAsync(arrayBuffer);
    const manifestEntry = zip.file('manifest.json');
    if (!manifestEntry) {
      throw new Error('manifest.json not found in the generated ZIP');
    }
    const manifest = JSON.parse(await manifestEntry.async('string'));
    const audioEntry = zip.file(manifest.generated_audio_filename);
    if (!audioEntry) {
      throw new Error('Audio file not found in the generated ZIP');
    }
    
    const audioBytes = await audioEntry.async('arraybuffer');
    const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);

    // リストへ追加
    generatedQueue.push({
      text: text,
      audioBlob: audioBlob,
      audioUrl: audioUrl,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    });

    renderGeneratedQueue();
    ttsStatus.textContent = 'Phrase and audio added to list!';
  } catch (error) {
    console.error(error);
    ttsStatus.textContent = `Generation failed: ${error.message}`;
  } finally {
    generateBundleButton.disabled = false;
  }
}

async function handleGenerateAllGradePhrases() {
  const level = ttsLevelSelect.value;
  const phrases = GRADE_PHRASES[level] || [];
  if (phrases.length === 0) {
    ttsStatus.textContent = 'No phrases found for the selected grade level.';
    return;
  }

  generateBundleButton.disabled = true;
  generateAllGradeButton.disabled = true;

  try {
    for (let i = 0; i < phrases.length; i += 1) {
      const phrase = phrases[i];
      ttsStatus.textContent = `Generating phrase ${i + 1}/${phrases.length} for ${level.toUpperCase()}...`;

      const formData = new FormData();
      formData.append('text', phrase);

      const [refAudioFile] = ttsRefAudioInput.files ?? [];
      if (refAudioFile) {
        formData.append('ref_audio', refAudioFile);
      }

      const response = await fetch('/api/generate-bundle', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorMsg = await response.text().catch(() => response.statusText);
        throw new Error(`Failed on phrase ${i + 1}: ${response.status} - ${errorMsg}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const manifestEntry = zip.file('manifest.json');
      if (!manifestEntry) {
        throw new Error('manifest.json not found in the generated ZIP');
      }
      const manifest = JSON.parse(await manifestEntry.async('string'));
      const audioEntry = zip.file(manifest.generated_audio_filename);
      if (!audioEntry) {
        throw new Error('Audio file not found in the generated ZIP');
      }

      const audioBytes = await audioEntry.async('arraybuffer');
      const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      generatedQueue.push({
        text: phrase,
        audioBlob: audioBlob,
        audioUrl: audioUrl,
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      });

      renderGeneratedQueue();
      
      // 連続リクエストでサーバー過負荷やOOMを防ぐため、少しウェイトを入れる
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    ttsStatus.textContent = `Successfully generated all ${phrases.length} phrases for ${level.toUpperCase()}!`;
  } catch (error) {
    console.error(error);
    ttsStatus.textContent = `Batch generation failed: ${error.message}`;
  } finally {
    generateBundleButton.disabled = false;
    generateAllGradeButton.disabled = false;
  }
}

function renderGeneratedQueue() {
  ttsQueueList.innerHTML = '';
  ttsQueueCount.textContent = String(generatedQueue.length);

  if (generatedQueue.length > 0) {
    ttsQueueContainer.hidden = false;
  } else {
    ttsQueueContainer.hidden = true;
    return;
  }

  generatedQueue.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'queue-item';

    const span = document.createElement('span');
    span.className = 'queue-item-text';
    span.textContent = `${index + 1}. ${item.text}`;
    span.title = item.text;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'queue-item-btn-container';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.textContent = 'Play';
    playBtn.className = 'queue-item-play-btn';
    playBtn.addEventListener('click', () => {
      const audio = new Audio(item.audioUrl);
      audio.play();
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = 'Delete';
    delBtn.className = 'queue-item-delete-btn';
    delBtn.addEventListener('click', () => {
      URL.revokeObjectURL(item.audioUrl);
      generatedQueue = generatedQueue.filter((q) => q.id !== item.id);
      renderGeneratedQueue();
    });

    btnContainer.appendChild(playBtn);
    btnContainer.appendChild(delBtn);
    div.appendChild(span);
    div.appendChild(btnContainer);
    ttsQueueList.appendChild(div);
  });
}

async function createBundleFromQueue() {
  if (generatedQueue.length === 0) {
    return;
  }

  createBundleButton.disabled = true;
  ttsStatus.textContent = 'Packaging study bundle ZIP...';

  try {
    const zip = new JSZip();
    
    // items 配列を構築
    const items = generatedQueue.map((item, idx) => {
      return {
        source_text: item.text,
        audio_filename: `audio_${idx}.wav`
      };
    });

    const manifest = {
      source_text: generatedQueue[0].text,
      generated_audio_filename: "audio_0.wav",
      language: "English",
      tts_model_name: "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
      created_at: new Date().toISOString(),
      schema_version: 2,
      items: items
    };

    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    // 各音声を追加
    for (let i = 0; i < generatedQueue.length; i += 1) {
      const item = generatedQueue[i];
      zip.file(`audio_${i}.wav`, item.audioBlob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const arrayBuffer = await zipBlob.arrayBuffer();

    // ダウンロード処理
    const downloadUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `study_bundle_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    // IndexedDB に保存
    console.log('Saving generated study bundle to IndexedDB...');
    await saveToIndexedDB('studyBundle', { name: `generated_${Date.now()}.zip`, data: zipBlob });

    // アプリ上にロード
    resetBundleView();
    await processStudyBundle(arrayBuffer, 'packaged from queue');
    await refreshStorageList();

    ttsStatus.textContent = 'Bundle successfully created, downloaded, and loaded!';
  } catch (error) {
    console.error(error);
    ttsStatus.textContent = `Failed to create bundle: ${error.message}`;
  } finally {
    createBundleButton.disabled = false;
  }
}

async function handleBundleItemChange() {
  if (!activeBundle || !activeBundle.items) {
    return;
  }
  const index = parseInt(bundleItemSelect.value, 10);
  const selectedItem = activeBundle.items[index];
  if (selectedItem) {
    sourceText.value = selectedItem.text;
    referenceAudio.src = selectedItem.audioUrl;
    transcribeReferenceButton.disabled = false;
    
    recordedAudio.hidden = true;
    recordedAudio.src = '';
    recordedBlob = null;
    transcriptText.value = '';
    scorePanel.hidden = true;
    runtimePanel.hidden = true;
  }
}

async function handleTtsRefAudioChange(event) {
  const [file] = event.target.files ?? [];
  if (!file) {
    console.log('Reference audio cleared. Deleting from IndexedDB...');
    await deleteFromIndexedDB('ttsRefAudio');
    await refreshStorageList();
    return;
  }

  // Validate file duration
  const audioUrl = URL.createObjectURL(file);
  const tempAudio = new Audio(audioUrl);
  tempAudio.addEventListener('loadedmetadata', () => {
    URL.revokeObjectURL(audioUrl);
    if (tempAudio.duration >= 30) {
      alert(`⚠️ 警告：選択された参照音声の長さは ${Math.round(tempAudio.duration)} 秒です。\nVoice Clone は30秒未満の短い音声ファイルで最もよく機能します。必要に応じて短いファイルを選択し直してください。`);
    }
  });

  try {
    console.log('Saving reference audio to IndexedDB:', file.name);
    await saveToIndexedDB('ttsRefAudio', { name: file.name, data: file });
    await refreshStorageList();
  } catch (error) {
    console.error('Failed to save reference audio:', error);
  }
}

function updateTtsPhraseOptions() {
  const level = ttsLevelSelect.value;
  const phrases = GRADE_PHRASES[level] || [];
  
  ttsPhraseSelect.innerHTML = '';
  phrases.forEach((phrase) => {
    const option = document.createElement('option');
    option.value = phrase;
    option.textContent = phrase.length > 50 ? phrase.substring(0, 47) + '...' : phrase;
    ttsPhraseSelect.appendChild(option);
  });

  if (phrases.length > 0) {
    ttsTextInput.value = phrases[0];
  }
}

function handleEngineChange() {
  const useOssLocal = isOssLocalMode();
  ossModelPanel.hidden = !useOssLocal;
  runtimePanel.hidden = true;
  transcriptText.value = '';
  scorePanel.hidden = true;
  refreshTranscribeButtonLabel();

  if (useOssLocal) {
    engineStatus.textContent = activeModelBundle
      ? 'Upload or load the packaged OSS model, then record and run post-recording transcription.'
      : 'Switching to OSS mode disables live browser ASR. Upload the packaged local model ZIP first.';
    return;
  }

  engineStatus.textContent = supportsSpeechRecognition()
    ? 'Browser SpeechRecognition will capture text while you record. The sample-audio test replays the uploaded clip and listens in best-effort mode.'
    : 'This browser does not expose SpeechRecognition. Recording still works, but browser ASR is unavailable here.';
}

async function handleModelBundleUpload(event) {
  const [file] = event.target.files ?? [];
  if (!file) {
    return;
  }

  modelStatus.textContent = 'Loading OSS model bundle…';

  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    console.log('Saving model bundle File object to IndexedDB...');
    await saveToIndexedDB('modelBundle', { name: file.name, data: file });
    modelMeta.hidden = true;
    loadModelButton.disabled = true;
    loadedLocalAsr = null;
    runtimePanel.hidden = true;
    await processModelBundle(arrayBuffer, 'uploaded');
    await refreshStorageList();
  } catch (error) {
    console.error(error);
    activeModelBundle = null;
    modelStatus.textContent = error.message;
  }
}

async function handleModelUrlLoad() {
  const url = modelUrlInput.value.trim();
  if (!url) {
    modelStatus.textContent = 'Please enter a valid URL.';
    return;
  }

  modelStatus.textContent = `Fetching OSS model bundle from ${url}…`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch model bundle: HTTP ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer]);
    console.log('Saving model bundle Blob to IndexedDB from URL...');
    await saveToIndexedDB('modelBundle', { name: url, data: blob });
    modelMeta.hidden = true;
    loadModelButton.disabled = true;
    loadedLocalAsr = null;
    runtimePanel.hidden = true;
    await processModelBundle(arrayBuffer, 'fetched from URL');
    await refreshStorageList();
  } catch (error) {
    console.error(error);
    activeModelBundle = null;
    modelStatus.textContent = error.message;
  }
}

async function processModelBundle(arrayBuffer, sourceLabel) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const manifestEntry = zip.file('manifest.json');
  if (!manifestEntry) {
    throw new Error('manifest.json was not found in the model bundle.');
  }

  const manifest = JSON.parse(await manifestEntry.async('string'));
  validateModelManifest(manifest);

  const assetEntries = new Map();
  const files = [];
  for (const entry of Object.values(zip.files)) {
    if (entry.dir || entry.name === 'manifest.json') {
      continue;
    }
    const normalizedNames = buildUploadedModelAssetPaths(manifest.model_id, entry.name);
    for (const normalizedName of normalizedNames) {
      assetEntries.set(normalizedName, entry);
    }
    files.push(...normalizedNames);
  }

  if (!assetEntries.size) {
    throw new Error('The model bundle contained no packaged model files.');
  }

  activeModelBundle = {
    manifest,
    assetEntries,
    fileCount: files.length,
  };

  const selectedVariant = selectModelVariant(manifest);
  const availableVariants = listModelVariantLabels(manifest);

  modelId.textContent = manifest.model_id;
  modelDevice.textContent = selectedVariant.preferred_device || manifest.preferred_device || 'auto';
  modelDtype.textContent = selectedVariant.dtype || manifest.dtype || 'default';
  modelFileCount.textContent = String(files.length);
  modelMeta.hidden = false;
  loadModelButton.disabled = false;
  const selectedVariantWarning = describeSelectedVariantWarning(manifest, selectedVariant, availableVariants);
  modelStatus.textContent = `Model bundle ready (${sourceLabel}). Available variants: ${availableVariants.join(', ')}. Press “Load OSS model” to initialize it in the browser.${selectedVariantWarning ? ` ${selectedVariantWarning}` : ''}`;
}

async function startPracticeCapture() {
  transcriptText.value = '';
  scorePanel.hidden = true;
  runtimePanel.hidden = true;
  recognitionFinalText = '';
  recordedChunks = [];
  recordedBlob = null;
  lastActiveTrimmedAudio = null;
  originalAudioWrapper.hidden = true;
  trimmedAudioWrapper.hidden = true;
  recordedAudio.src = '';
  trimmedRecordedAudio.src = '';

  const vadVisualizerWrapper = document.querySelector('#vad-visualization-wrapper');
  if (vadVisualizerWrapper) {
    vadVisualizerWrapper.hidden = true;
  }

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('navigator.mediaDevices is not available. Microphone access requires a secure context (HTTPS or localhost).');
    }
    const selectedMicId = micSelect.value;
    const audioConstraints = {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true
    };
    if (selectedMicId) {
      audioConstraints.deviceId = { exact: selectedMicId };
    }
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
    addDebugLog('navigator.mediaDevices.getUserMedia: Success');

    // マイクのアクセス許可が得られたため、ラベル名を正しく取得して一覧を更新する
    await updateAudioDevices();
    
    // Stream tracks debugging
    mediaStream.getTracks().forEach((track, idx) => {
      addDebugLog(`Stream Track [${idx}]: label="${track.label}" kind="${track.kind}" enabled=${track.enabled} readyState="${track.readyState}"`);
      track.onmute = () => addDebugLog(`Stream Track [${idx}] event: mute (readyState="${track.readyState}")`);
      track.onunmute = () => addDebugLog(`Stream Track [${idx}] event: unmute (readyState="${track.readyState}")`);
      track.onended = () => addDebugLog(`Stream Track [${idx}] event: ended (readyState="${track.readyState}")`);
    });

    mediaRecorder = new MediaRecorder(mediaStream);
    addDebugLog(`MediaRecorder initialized: state="${mediaRecorder.state}" mimeType="${mediaRecorder.mimeType}"`);

    mediaRecorder.onstart = () => addDebugLog('MediaRecorder event: start');
    mediaRecorder.onpause = () => addDebugLog('MediaRecorder event: pause');
    mediaRecorder.onresume = () => addDebugLog('MediaRecorder event: resume');
    mediaRecorder.onerror = (e) => addDebugLog(`MediaRecorder event: error (${e.error?.name || 'unknown'}: ${e.error?.message || ''})`);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        addDebugLog(`MediaRecorder event: dataavailable (chunk size=${event.data.size} bytes)`);
      }
    };
    mediaRecorder.onstop = async () => {
      addDebugLog('MediaRecorder event: stop started');
      recordingStatus.textContent = 'Processing recorded audio...';
      recordedBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      recordedAudio.src = URL.createObjectURL(recordedBlob);
      originalAudioWrapper.hidden = false;

      try {
        const sampleRate = (loadedLocalAsr?.samplingRate) || 16000;
        addDebugLog(`Decoding recorded audio blob (size=${recordedBlob.size} bytes, mimeType="${recordedBlob.type}", sampleRate=${sampleRate})...`);
        const rawAudioInput = await decodeAudioBlobForAsr(recordedBlob, sampleRate);
        addDebugLog(`Audio decoded successfully. Raw length = ${rawAudioInput.length} samples.`);
        
        let sum = 0;
        for (let i = 0; i < rawAudioInput.length; i += 1) {
          sum += Math.abs(rawAudioInput[i]);
        }
        const meanVal = sum / (rawAudioInput.length || 1);
        const threshold = meanVal / 3;
        addDebugLog(`VAD parameters calculated. Mean = ${meanVal.toFixed(5)}, Threshold = ${threshold.toFixed(5)}`);
        
        const audioInput = removeLongSilences(rawAudioInput, sampleRate, threshold);
        lastActiveTrimmedAudio = audioInput;
        addDebugLog(`VAD processing complete. Active segments detected: ${audioInput.vadSegments?.length || 0}`);

        const trimmedBlob = bufferToWav(audioInput, sampleRate);
        trimmedRecordedAudio.src = URL.createObjectURL(trimmedBlob);
        trimmedAudioWrapper.hidden = false;

        updateVadVisualizer(audioInput.vadSegments, audioInput.vadNumFrames);
        recordingStatus.textContent = 'Audio processed. Ready to transcribe.';
      } catch (err) {
        console.error('Error processing audio after recording:', err);
        recordingStatus.textContent = `Error processing audio: ${err.message}`;
      }

      transcribeButton.disabled = false;
      if (autoAsrCheckbox.checked) {
        transcribeRecording();
      }
    };

    // Start silent oscillator to keep AudioSession active (preventing mic muting on playback end)
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        silentAudioContext = new AudioContextClass();
        const selectedSpeakerId = speakerSelect ? speakerSelect.value : '';
        if (selectedSpeakerId && typeof silentAudioContext.setSinkId === 'function') {
          await silentAudioContext.setSinkId(selectedSpeakerId);
          addDebugLog(`Silent AudioContext output set to ${selectedSpeakerId}`);
        }
        const gainNode = silentAudioContext.createGain();
        gainNode.gain.value = 0.0;
        gainNode.connect(silentAudioContext.destination);

        silentOscillator = silentAudioContext.createOscillator();
        silentOscillator.connect(gainNode);
        silentOscillator.start(0);
        addDebugLog('Silent oscillator started to keep AudioSession active.');
      }
    } catch (audioErr) {
      console.warn('Failed to start silent oscillator:', audioErr);
      addDebugLog(`Warning: Failed to start silent oscillator: ${audioErr.message}`);
    }

    mediaRecorder.start();

    recognition = null;
    if (!isOssLocalMode()) {
      recognition = createRecognition(activeBundle?.manifest?.language || 'English');
      if (recognition) {
        recognition.start();
      }
    }

    recordButton.disabled = true;
    stopButton.disabled = false;
    recordingStatus.textContent = isOssLocalMode()
      ? 'Recording… stop when finished, then run OSS transcription.'
      : 'Recording… speak clearly in English.';
  } catch (error) {
    console.error(error);
    recordingStatus.textContent = `Could not start recording: ${error.message}`;
  }
}

async function handleStartPractice() {
  try {
    await startPracticeCapture();
    if (referenceAudio.src) {
      referenceAudio.pause();
      referenceAudio.currentTime = 0;
      await referenceAudio.play();
      console.log('Practice started: playing reference audio.');
    }
  } catch (error) {
    console.error('Failed to auto-start practice:', error);
    recordingStatus.textContent = `Could not start practice: ${error.message}`;
  }
}

function stopPracticeCapture() {
  addDebugLog('stopPracticeCapture() called');
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    addDebugLog('Calling mediaRecorder.stop()');
    mediaRecorder.stop();
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => {
      addDebugLog(`Stopping stream track: label="${track.label}"`);
      track.stop();
    });
  }
  if (recognition) {
    addDebugLog('Stopping SpeechRecognition');
    recognition.stop();
  }

  // Stop silent oscillator and AudioContext
  if (silentOscillator) {
    try {
      silentOscillator.stop();
      addDebugLog('Silent oscillator stopped.');
    } catch (e) {
      console.warn('Failed to stop silent oscillator:', e);
    }
    silentOscillator = null;
  }
  if (silentAudioContext) {
    try {
      silentAudioContext.close();
      addDebugLog('Silent AudioContext closed.');
    } catch (e) {
      console.warn('Failed to close silent AudioContext:', e);
    }
    silentAudioContext = null;
  }

  recordButton.disabled = false;
  stopButton.disabled = true;
  recordingStatus.textContent = isOssLocalMode()
    ? 'Recording stopped. Press “Run OSS transcription” to review the result.'
    : 'Recording stopped. Press “Transcribe” to review the result.';
}

function transcribeRecording() {
  if (isOssLocalMode()) {
    return transcribeWithUploadedOssModel();
  }

  if (!recognitionFinalText.trim()) {
    transcriptText.value = 'No speech recognition result was captured. Try Chrome/Edge on mobile or retry with a quieter environment.';
    return;
  }

  transcriptText.value = recognitionFinalText.trim();
  renderScore(sourceText.value, recognitionFinalText);
  renderRuntimeMetrics({
    engine: 'Browser SpeechRecognition',
    backend: 'browser',
    loadMs: null,
    transcribeMs: null,
    decodeMs: null,
    modelMs: null,
    postprocessMs: null,
  });
  if (autoCompareCheckbox.checked) {
    renderComparison();
  }
}

async function transcribeWithUploadedOssModel() {
  if (!recordedBlob) {
    transcriptText.value = 'Record audio first, then run OSS transcription.';
    return;
  }

  try {
    await transcribeAudioBlobWithOssModel(recordedBlob, 'recorded audio', transcribeButton);
  } catch (error) {
    console.error(error);
    transcriptText.value = `OSS transcription failed: ${formatUnknownError(error)}`;
  }
}

async function transcribeReferenceAudio() {
  if (!activeBundle?.audioBlob) {
    transcriptText.value = 'Upload a study bundle first.';
    return;
  }

  if (!isOssLocalMode()) {
    return transcribeReferenceAudioWithSpeechRecognition();
  }

  try {
    await transcribeAudioBlobWithOssModel(activeBundle.audioBlob, 'uploaded sample audio', transcribeReferenceButton);
  } catch (error) {
    console.error(error);
    transcriptText.value = `Sample-audio ASR failed: ${formatUnknownError(error)}`;
  }
}

async function transcribeReferenceAudioWithSpeechRecognition() {
  if (!supportsSpeechRecognition()) {
    transcriptText.value = 'This browser does not expose SpeechRecognition.';
    return;
  }

  if (!activeBundle?.audioUrl) {
    transcriptText.value = 'Upload a study bundle first.';
    return;
  }

  if (!referenceAudio.src) {
    transcriptText.value = 'The uploaded sample audio is not ready yet.';
    return;
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    transcriptText.value = 'Stop microphone recording before running the sample-audio SpeechRecognition test.';
    return;
  }

  const sampleRecognition = createRecognition(activeBundle?.manifest?.language || 'English');
  if (!sampleRecognition) {
    transcriptText.value = 'SpeechRecognition is not available in this browser.';
    return;
  }

  transcriptText.value = '';
  recognitionFinalText = '';
  scorePanel.hidden = true;
  runtimePanel.hidden = true;
  transcribeReferenceButton.disabled = true;
  recordingStatus.textContent = 'Playing uploaded sample audio and listening with SpeechRecognition. Increase speaker volume if needed.';

  try {
    const finalText = await runSpeechRecognitionPlaybackTest(sampleRecognition, referenceAudio);
    if (!finalText.trim()) {
      transcriptText.value = 'SpeechRecognition did not capture the sample playback. Try higher speaker volume, less noise, or use the OSS local model mode.';
      return;
    }

    transcriptText.value = finalText.trim();
    renderScore(sourceText.value, finalText);
    renderRuntimeMetrics({
      engine: 'Browser SpeechRecognition',
      backend: 'browser-playback',
      loadMs: null,
      transcribeMs: null,
      decodeMs: null,
      modelMs: null,
      postprocessMs: null,
    });
    recordingStatus.textContent = 'SpeechRecognition sample-audio test finished.';
  } catch (error) {
    console.error(error);
    transcriptText.value = `Sample-audio ASR failed: ${formatUnknownError(error)}`;
  } finally {
    transcribeReferenceButton.disabled = false;
  }
}

async function runSpeechRecognitionPlaybackTest(sampleRecognition, audioElement) {
  return new Promise(async (resolve, reject) => {
    let finished = false;
    let interimText = '';
    let playbackEnded = false;
    let stopTimer = null;

    const cleanup = () => {
      audioElement.removeEventListener('ended', handleEnded);
      sampleRecognition.onresult = null;
      sampleRecognition.onerror = null;
      sampleRecognition.onend = null;
      if (stopTimer) {
        clearTimeout(stopTimer);
      }
    };

    const finish = (callback) => {
      if (finished) {
        return;
      }
      finished = true;
      cleanup();
      callback();
    };

    const handleEnded = () => {
      playbackEnded = true;
      stopTimer = window.setTimeout(() => {
        try {
          sampleRecognition.stop();
        } catch {
          finish(() => resolve(`${recognitionFinalText}${interimText}`.trim()));
        }
      }, 400);
    };

    sampleRecognition.onresult = (event) => {
      interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          recognitionFinalText += `${text} `;
        } else {
          interimText += text;
        }
      }
      transcriptText.value = `${recognitionFinalText}${interimText}`.trim();
    };

    sampleRecognition.onerror = (event) => {
      finish(() => reject(new Error(`Speech recognition error: ${event.error}`)));
    };

    sampleRecognition.onend = () => {
      if (!playbackEnded) {
        finish(() => reject(new Error('SpeechRecognition ended before sample playback completed.')));
        return;
      }
      finish(() => resolve(`${recognitionFinalText}${interimText}`.trim()));
    };

    audioElement.addEventListener('ended', handleEnded, { once: true });

    try {
      audioElement.pause();
      audioElement.currentTime = 0;
      sampleRecognition.start();
      await audioElement.play();
    } catch (error) {
      finish(() => reject(error instanceof Error ? error : new Error(String(error))));
    }
  });
}

async function transcribeAudioBlobWithOssModel(audioBlob, label, triggerButton = null) {
  // Disable ASR/recording buttons to prevent double-clicks
  transcribeButton.disabled = true;
  transcribeReferenceButton.disabled = true;
  recordButton.disabled = true;
  
  if (triggerButton) {
    triggerButton.classList.add('is-loading');
  }
  
  if (asrProgressContainer && asrProgressText) {
    asrProgressText.textContent = `Processing ASR (${label}): decoding audio...`;
    asrProgressContainer.hidden = false;
  }

  try {
    const asr = await ensureUploadedOssModelLoaded();
    const decodeStartedAt = performance.now();
    let audioInput;

    if (lastActiveTrimmedAudio && audioBlob === recordedBlob) {
      audioInput = lastActiveTrimmedAudio;
    } else {
      const rawAudioInput = await decodeAudioBlobForAsr(audioBlob, asr.samplingRate || 16000);
      
      let sum = 0;
      for (let i = 0; i < rawAudioInput.length; i += 1) {
        sum += Math.abs(rawAudioInput[i]);
      }
      const meanVal = sum / (rawAudioInput.length || 1);
      const threshold = meanVal / 3;
      
      audioInput = removeLongSilences(rawAudioInput, asr.samplingRate || 16000, threshold);
      
      try {
        const trimmedBlob = bufferToWav(audioInput, asr.samplingRate || 16000);
        trimmedRecordedAudio.src = URL.createObjectURL(trimmedBlob);
        trimmedAudioWrapper.hidden = false;
      } catch (wavErr) {
        console.error('Failed to create WAV for trimmed audio:', wavErr);
      }
    }

    const decodeMs = performance.now() - decodeStartedAt;

    if (asrProgressText) {
      asrProgressText.textContent = `Processing ASR (${label}): running Whisper model...`;
    }

    const modelStartedAt = performance.now();
    const result = await asr.pipeline(audioInput, {
      chunk_length_s: 20,
      stride_length_s: 4,
      return_timestamps: false,
    });
    const modelMs = performance.now() - modelStartedAt;

    const postprocessStartedAt = performance.now();
    const text = extractTranscriptText(result);
    transcriptText.value = text || '(no transcription text was returned)';
    renderScore(sourceText.value, text);
    const postprocessMs = performance.now() - postprocessStartedAt;
    const elapsedMs = decodeMs + modelMs + postprocessMs;

    renderRuntimeMetrics({
      engine: 'OSS local model',
      backend: asr.backend,
      loadMs: asr.loadMs,
      transcribeMs: elapsedMs,
      decodeMs,
      modelMs,
      postprocessMs,
    });
    recordingStatus.textContent = `OSS transcription for ${label} finished in ${formatDuration(elapsedMs)}.`;
    if (autoCompareCheckbox.checked) {
      renderComparison();
    }
  } finally {
    if (asrProgressContainer) {
      asrProgressContainer.hidden = true;
    }
    if (triggerButton) {
      triggerButton.classList.remove('is-loading');
    }
    // Re-enable buttons
    transcribeButton.disabled = false;
    transcribeReferenceButton.disabled = false;
    recordButton.disabled = false;
  }
}

async function loadUploadedOssModel() {
  try {
    await ensureUploadedOssModelLoaded(true);
  } catch (error) {
    console.error(error);
    modelStatus.textContent = `Failed to load OSS model: ${formatUnknownError(error)}`;
  }
}

async function ensureUploadedOssModelLoaded(forceReload = false) {
  const modelSource = modelSourceSelect?.value || 'bundle';
  if (modelSource === 'huggingface') {
    const modelId = getSelectedHfModelId();
    if (!modelId) {
      throw new Error('Please select or enter a Hugging Face model ID.');
    }
    if (forceReload || !activeModelBundle || activeModelBundle.manifest.model_id !== modelId) {
      await buildModelBundleFromHf(modelId, 'uint8');
    }
  }

  if (!activeModelBundle) {
    throw new Error('Upload an OSS model bundle first.');
  }

  const variant = selectModelVariant(activeModelBundle.manifest);

  if (
    !forceReload
    && loadedLocalAsr?.manifest?.model_id === activeModelBundle.manifest.model_id
    && loadedLocalAsr?.backend === variant.preferred_device
    && loadedLocalAsr?.dtype === variant.dtype
  ) {
    return loadedLocalAsr;
  }

  modelStatus.textContent = `Initializing OSS model with transformers.js ${TRANSFORMERS_JS_VERSION}…`;
  loadModelButton.disabled = true;

  const { env, pipeline, LogLevel } = await getTransformersModule();
  const backend = variant.preferred_device;
  const customFetch = buildUploadedModelFetch(activeModelBundle.assetEntries);
  installUploadedModelFetchInterceptor(customFetch);
  env.logLevel = LogLevel?.ERROR ?? 40;
  if (env.backends?.onnx) {
    env.backends.onnx.logLevel = 'error';
  }
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = UPLOADED_MODEL_ROOT;
  env.useBrowserCache = false;
  env.useCustomCache = true;
  env.customCache = buildUploadedModelCache(activeModelBundle.assetEntries);
  env.fetch = customFetch;

  const startedAt = performance.now();
  const transcriber = await pipeline(
    'automatic-speech-recognition',
    activeModelBundle.manifest.model_id,
    {
      device: backend,
      dtype: variant.dtype || undefined,
      progress_callback: (progress) => {
        const status = progress?.status || 'loading';
        const filename = progress?.file || progress?.name || 'model file';
        modelStatus.textContent = `Loading OSS model with transformers.js ${TRANSFORMERS_JS_VERSION}: ${status} ${filename}`;
      },
    },
  );
  const loadMs = performance.now() - startedAt;

  loadedLocalAsr = {
    manifest: activeModelBundle.manifest,
    backend,
    dtype: variant.dtype,
    samplingRate: transcriber?.processor?.feature_extractor?.config?.sampling_rate || 16000,
    loadMs,
    pipeline: transcriber,
  };

  modelStatus.textContent = `OSS model ready in ${formatDuration(loadMs)} with transformers.js ${TRANSFORMERS_JS_VERSION}.`;
  loadModelButton.disabled = false;
  renderRuntimeMetrics({
    engine: 'OSS local model',
    backend,
    loadMs,
    transcribeMs: null,
    decodeMs: null,
    modelMs: null,
    postprocessMs: null,
  });

  return loadedLocalAsr;
}

function getSelectedHfModelId() {
  const selectVal = modelHfSelect?.value;
  const customVal = modelHfCustomInput?.value?.trim();
  return customVal || selectVal;
}

async function buildModelBundleFromHf(modelId, dtype = 'uint8') {
  modelStatus.textContent = `Fetching file list from Hugging Face API for ${modelId}...`;
  if (loadModelButton) loadModelButton.disabled = true;
  if (loadModelHfButton) loadModelHfButton.disabled = true;
  activeHfModelId = modelId;

  try {
    // 1. Fetch Hugging Face repo file list
    const apiUrl = `https://huggingface.co/api/models/${modelId}`;
    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) {
      throw new Error(`Failed to fetch model info from Hugging Face API: HTTP ${apiRes.status}`);
    }
    const modelInfo = await apiRes.json();
    const repoFiles = (modelInfo.siblings || []).map(s => s.rpath || s.rfilename).filter(Boolean);

    // 2. Resolve files to download (following python logic)
    const CORE_MODEL_FILES = [
      "added_tokens.json",
      "config.json",
      "generation_config.json",
      "merges.txt",
      "normalizer.json",
      "preprocessor_config.json",
      "quantize_config.json",
      "special_tokens_map.json",
      "tokenizer.json",
      "tokenizer_config.json",
      "vocab.json",
    ];

    const DTYPE_SUFFIX_MAP = {
      "fp32": "",
      "fp16": "_fp16",
      "q8": "_quantized",
      "q4": "_q4",
      "int8": "_int8",
      "uint8": "_uint8",
      "bnb4": "_bnb4",
    };

    const suffix = DTYPE_SUFFIX_MAP[dtype];
    if (suffix === undefined) {
      throw new Error(`Unsupported dtype: ${dtype}`);
    }

    const selectedFiles = CORE_MODEL_FILES.filter(path => repoFiles.includes(path));

    const MODEL_FILE_GROUPS = [
      ["onnx/encoder_model{suffix}.onnx", "onnx/decoder_model_merged{suffix}.onnx"],
      [
        "onnx/encoder_model{suffix}.onnx",
        "onnx/decoder_model{suffix}.onnx",
        "onnx/decoder_with_past_model{suffix}.onnx",
      ],
    ];

    let resolvedGroup = null;
    for (const group of MODEL_FILE_GROUPS) {
      const resolved = group.map(pattern => pattern.replace('{suffix}', suffix));
      if (resolved.every(path => repoFiles.includes(path))) {
        resolvedGroup = resolved;
        break;
      }
    }

    if (!resolvedGroup) {
      console.warn(`Could not resolve exact ONNX groups for suffix ${suffix}. Searching for raw ONNX files...`);
      const onnxFiles = repoFiles.filter(path => path.startsWith("onnx/") && path.endsWith(".onnx"));
      if (onnxFiles.length > 0) {
        resolvedGroup = onnxFiles;
      } else {
        throw new Error(`Could not resolve ONNX files for dtype ${dtype}. Repo files: ${repoFiles.join(', ')}`);
      }
    }

    selectedFiles.push(...resolvedGroup);

    // 3. Download files
    const fileDataMap = new Map();
    let completedCount = 0;
    downloadedHfFiles.clear();
    
    for (const filePath of selectedFiles) {
      modelStatus.textContent = `Downloading ASR files (${completedCount + 1}/${selectedFiles.length}): ${filePath}...`;
      const fileUrl = `https://huggingface.co/${modelId}/resolve/main/${filePath}`;
      
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download ${filePath}: HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      fileDataMap.set(filePath, buffer);
      downloadedHfFiles.set(filePath, buffer); // Keep in memory for browser "Save Loaded Model as ZIP" button
      completedCount += 1;
    }

    // 4. Create manifest
    const manifest = {
      format: "study-lang-mobile-asr-model-bundle/v1",
      engine: "transformers.js",
      task: "automatic-speech-recognition",
      model_id: modelId,
      dtype: dtype,
      preferred_device: "wasm",
      default_variant: {
        preferred_device: "wasm",
        dtype: dtype
      },
      variants: [
        {
          preferred_device: "wasm",
          dtype: dtype,
          files: selectedFiles
        }
      ],
      generated_at: new Date().toISOString(),
      files: selectedFiles
    };

    // 5. Zip files
    modelStatus.textContent = `Packaging model ZIP...`;
    const zip = new JSZip();
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
    for (const [filePath, buffer] of fileDataMap.entries()) {
      zip.file(filePath, buffer);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const cleanModelName = modelId.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `mobile_asr_model_bundle_${cleanModelName}.zip`;

    // 6. Save to IndexedDB
    console.log(`Saving downloaded HF model ZIP to IndexedDB: ${filename}`);
    await saveToIndexedDB('modelBundle', { name: filename, data: zipBlob });
    await refreshStorageList();

    // 7. Load using processModelBundle to populate activeModelBundle
    const arrayBuffer = await zipBlob.arrayBuffer();
    await processModelBundle(arrayBuffer, 'downloaded from Hugging Face');

    if (saveModelZipButton) {
      saveModelZipButton.style.display = 'block';
    }

    modelStatus.textContent = `Model ${modelId} successfully downloaded, packaged, and parsed! Initializing pipeline next...`;
  } catch (error) {
    console.error(error);
    throw new Error(`HF model bundle creation failed: ${error.message}`);
  } finally {
    if (loadModelButton) loadModelButton.disabled = false;
    if (loadModelHfButton) loadModelHfButton.disabled = false;
  }
}

function selectModelVariant(manifest) {
  const variants = Array.isArray(manifest.variants) && manifest.variants.length
    ? manifest.variants
    : [{ preferred_device: manifest.preferred_device || selectModelBackend(manifest), dtype: manifest.dtype }];

  const preferredBackend = navigator.gpu ? 'webgpu' : 'wasm';
  const backendVariants = variants.filter((variant) => variant.preferred_device === preferredBackend);
  const candidates = backendVariants.length ? backendVariants : variants;

  return [...candidates].sort((left, right) => {
    return scoreModelVariant(manifest, right, preferredBackend) - scoreModelVariant(manifest, left, preferredBackend);
  })[0];
}

function listModelVariantLabels(manifest) {
  const variants = Array.isArray(manifest.variants) && manifest.variants.length
    ? manifest.variants
    : [{ preferred_device: manifest.preferred_device || 'auto', dtype: manifest.dtype || 'default' }];

  return variants.map((variant) => `${variant.preferred_device}:${variant.dtype}`);
}

function scoreModelVariant(manifest, variant, preferredBackend) {
  let score = 0;

  if (variant.preferred_device === preferredBackend) {
    score += 100;
  }

  if (isKnownBrokenWhisperWasmQ8OrInt8(manifest, variant)) {
    score -= 1000;
  }

  if (preferredBackend === 'wasm' && isWhisperModelId(manifest?.model_id)) {
    if (variant.dtype === 'uint8') {
      score += 50;
    } else if (variant.dtype === 'int8') {
      score += 20;
    } else if (variant.dtype === 'q8') {
      score -= 200;
    }
  }

  if (variant.dtype === 'q8') {
    score += 10;
  }

  return score;
}

function describeSelectedVariantWarning(manifest, selectedVariant, availableVariants) {
  if (!isKnownBrokenWhisperWasmQ8OrInt8(manifest, selectedVariant)) {
    return '';
  }

  const safeFallback = availableVariants.find((label) => label === 'wasm:uint8');
  if (safeFallback) {
    return `Warning: ${selectedVariant.preferred_device}:${selectedVariant.dtype} is known to fail due to ConvInteger support issues. Prefer ${safeFallback}.`;
  }

  return `Warning: ${selectedVariant.preferred_device}:${selectedVariant.dtype} is known to fail due to ConvInteger support issues. If loading fails, rebuild the bundle with wasm:uint8.`;
}

function isWhisperModelId(modelId) {
  return typeof modelId === 'string' && /whisper/i.test(modelId);
}

function isKnownBrokenWhisperWasmQ8OrInt8(manifest, variant) {
  return isWhisperModelId(manifest?.model_id)
    && variant?.preferred_device === 'wasm'
    && (variant?.dtype === 'q8' || variant?.dtype === 'int8');
}

function createRecognition(languageLabel) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    recordingStatus.textContent = 'This browser does not expose the Web Speech API. Recording still works, but live browser ASR is unavailable.';
    return null;
  }

  const instance = new SpeechRecognition();
  instance.lang = mapLanguageToLocale(languageLabel);
  instance.continuous = false;
  instance.interimResults = true;
  instance.maxAlternatives = 1;

  instance.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        recognitionFinalText += `${text} `;
      } else {
        interim += text;
      }
    }
    transcriptText.value = `${recognitionFinalText}${interim}`.trim();
  };

  instance.onerror = (event) => {
    recordingStatus.textContent = `Speech recognition error: ${event.error}`;
  };

  return instance;
}

function validateModelManifest(manifest) {
  if (manifest.format !== 'study-lang-mobile-asr-model-bundle/v1') {
    throw new Error('Unsupported model bundle format.');
  }
  if (manifest.engine !== 'transformers.js') {
    throw new Error('This prototype only supports Transformers.js model bundles.');
  }
  if (manifest.task !== 'automatic-speech-recognition') {
    throw new Error('The uploaded model bundle is not an ASR bundle.');
  }
  if (!manifest.model_id) {
    throw new Error('The model bundle manifest is missing model_id.');
  }
}

function buildUploadedModelFetch(assetEntries) {
  const fallbackFetch = originalWindowFetch || window.fetch.bind(window);

  return async (input, init) => {
    const requestUrl = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input?.url || '';

    if (!requestUrl.includes(UPLOADED_MODEL_ROOT)) {
      return fallbackFetch(input, init);
    }

    const url = new URL(requestUrl, window.location.href);
    const entry = assetEntries.get(url.pathname);

    if (entry) {
      const data = await entry.async('arraybuffer');
      return createBinaryResponse(data, entry.name);
    }

    try {
      return await fallbackFetch(input, init);
    } catch (error) {
      console.warn(`Fallback fetch failed for ${requestUrl}, returning 404:`, error);
      return new Response(null, { status: 404, statusText: 'Not Found' });
    }
  };
}

function buildUploadedModelCache(assetEntries) {
  return {
    async match(request) {
      const requestUrl = typeof request === 'string'
        ? request
        : request instanceof URL
          ? request.toString()
          : request?.url;

      if (!requestUrl) {
        return undefined;
      }

      const url = new URL(requestUrl, window.location.href);
      const entry = assetEntries.get(url.pathname);
      if (!entry) {
        return undefined;
      }

      const data = await entry.async('arraybuffer');
      return createBinaryResponse(data, entry.name);
    },

    async put() {
      return undefined;
    },
  };
}

function installUploadedModelFetchInterceptor(customFetch) {
  if (!originalWindowFetch) {
    originalWindowFetch = window.fetch.bind(window);
  }
  window.fetch = customFetch;
}

function buildUploadedModelAssetPaths(modelId, entryName) {
  const cleanEntryName = entryName.replace(/^\/+/, '');
  const cleanModelId = String(modelId || '').replace(/^\/+|\/+$/g, '');
  const paths = new Set([
    `${UPLOADED_MODEL_ROOT}${cleanEntryName}`,
  ]);

  if (cleanModelId) {
    paths.add(`${UPLOADED_MODEL_ROOT}${cleanModelId}/${cleanEntryName}`);

    if (cleanEntryName.startsWith(`${cleanModelId}/`)) {
      paths.add(`${UPLOADED_MODEL_ROOT}${cleanEntryName.slice(cleanModelId.length + 1)}`);
    }
  }

  return [...paths];
}

async function getTransformersModule() {
  if (!transformersModulePromise) {
    transformersModulePromise = import(TRANSFORMERS_JS_CDN);
  }
  return transformersModulePromise;
}

function resolveTransformersJsVersion() {
  const params = new URLSearchParams(window.location.search);
  return params.get('transformersjs') || DEFAULT_TRANSFORMERS_JS_VERSION;
}

async function decodeAudioBlobForAsr(audioBlob, targetSampleRate = 16000) {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error('This browser does not expose AudioContext, so uploaded audio cannot be decoded for OSS ASR.');
  }

  const audioContext = new AudioContextCtor();
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const monoChannel = mixToMonoChannel(audioBuffer);
    return resampleMonoAudio(monoChannel, audioBuffer.sampleRate, targetSampleRate);
  } finally {
    await audioContext.close();
  }
}


function removeLongSilences(audioData, sampleRate = 16000, threshold, marginSec = 0.4) {
  const frameSize = Math.round(0.02 * sampleRate); // 20ms frame
  const speechToSilenceFrames = Math.round(1.0 / 0.02); // 1.0s hangover = 50 frames
  const silenceToSpeechFrames = Math.round(0.1 / 0.02); // 100ms startup = 5 frames
  const marginSamples = Math.round(marginSec * sampleRate);

  const numFrames = Math.floor(audioData.length / frameSize);
  if (numFrames === 0) {
    return audioData;
  }

  // しきい値が小さすぎ・大きすぎないように制限 (下限 0.015)
  const activeThreshold = Math.max(threshold, 0.015);
  
  const frameFlags = new Uint8Array(numFrames);
  for (let f = 0; f < numFrames; f += 1) {
    const startIdx = f * frameSize;
    let sum = 0;
    for (let i = 0; i < frameSize; i += 1) {
      sum += Math.abs(audioData[startIdx + i]);
    }
    const energy = sum / frameSize;
    frameFlags[f] = (energy >= activeThreshold) ? 1 : 0;
  }

  const segments = [];
  let inSpeech = false;
  let silenceCounter = 0;
  let speechCounter = 0;
  let segmentStartFrame = 0;

  for (let f = 0; f < numFrames; f += 1) {
    const isFrameActive = (frameFlags[f] === 1);

    if (inSpeech) {
      if (!isFrameActive) {
        silenceCounter += 1;
        if (silenceCounter >= speechToSilenceFrames) {
          // 1秒以上の無音が確定したため、この手前までを有声区間とする
          const segmentEndFrame = f - speechToSilenceFrames + 1;
          segments.push({ startFrame: segmentStartFrame, endFrame: segmentEndFrame });
          inSpeech = false;
          silenceCounter = 0;
          speechCounter = 0;
        }
      } else {
        silenceCounter = 0;
      }
    } else {
      if (isFrameActive) {
        speechCounter += 1;
        if (speechCounter >= silenceToSpeechFrames) {
          segmentStartFrame = f - silenceToSpeechFrames + 1;
          inSpeech = true;
          speechCounter = 0;
          silenceCounter = 0;
        }
      } else {
        speechCounter = 0;
      }
    }
  }

  if (inSpeech) {
    segments.push({ startFrame: segmentStartFrame, endFrame: numFrames });
  }

  if (segments.length === 0) {
    console.log("VAD: No speech segments detected. Returning original buffer (fallback).");
    const fallbackResult = new Float32Array(audioData);
    fallbackResult.vadSegments = [];
    fallbackResult.vadNumFrames = numFrames;
    fallbackResult.vadFrameSize = frameSize;
    return fallbackResult;
  }

  const chunks = [];
  for (let s = 0; s < segments.length; s += 1) {
    const seg = segments[s];
    const rawStartIdx = seg.startFrame * frameSize;
    const rawEndIdx = seg.endFrame * frameSize;

    const startIdx = Math.max(0, rawStartIdx - marginSamples);
    const endIdx = Math.min(audioData.length, rawEndIdx + marginSamples);

    if (endIdx > startIdx) {
      chunks.push(audioData.subarray(startIdx, endIdx));
    }
  }

  if (chunks.length === 0) {
    return new Float32Array();
  }
  if (chunks.length === 1) {
    return chunks[0];
  }

  let totalLength = 0;
  chunks.forEach(c => totalLength += c.length);
  const result = new Float32Array(totalLength);
  let offset = 0;
  chunks.forEach(c => {
    result.set(c, offset);
    offset += c.length;
  });

  console.log(`VAD (1s threshold) processed. Original: ${audioData.length} samples, New (Speech segments merged): ${totalLength} samples. Detected ${segments.length} segments.`);
  result.vadSegments = segments;
  result.vadNumFrames = numFrames;
  result.vadFrameSize = frameSize;
  return result;
}

function updateVadVisualizer(segments, numFrames) {
  const vadBar = document.querySelector('#vad-bar');
  const wrapper = document.querySelector('#vad-visualization-wrapper');
  if (!vadBar || !wrapper) return;

  if (!segments || numFrames === 0) {
    wrapper.hidden = true;
    return;
  }

  const gradientParts = [];
  let lastPercent = 0;

  if (segments.length === 0) {
    // 検出セグメントが0件の場合、全体をグレー（無声区間）として描画
    gradientParts.push(`#4b5563 0%`);
    gradientParts.push(`#4b5563 100%`);
  } else {
    for (let s = 0; s < segments.length; s += 1) {
      const seg = segments[s];
      const startPercent = (seg.startFrame / numFrames) * 100;
      const endPercent = (seg.endFrame / numFrames) * 100;

      if (startPercent > lastPercent) {
        gradientParts.push(`#4b5563 ${lastPercent.toFixed(2)}%`);
        gradientParts.push(`#4b5563 ${startPercent.toFixed(2)}%`);
      }

      gradientParts.push(`#3b82f6 ${startPercent.toFixed(2)}%`);
      gradientParts.push(`#3b82f6 ${endPercent.toFixed(2)}%`);

      lastPercent = endPercent;
    }

    if (lastPercent < 100) {
      gradientParts.push(`#4b5563 ${lastPercent.toFixed(2)}%`);
      gradientParts.push(`#4b5563 100%`);
    }
  }

  const gradientStr = `linear-gradient(to right, ${gradientParts.join(', ')})`;
  vadBar.style.background = gradientStr;
  wrapper.hidden = false;
}

function bufferToWav(buffer, sampleRate = 16000) {
  const bufferLength = buffer.length;
  const wavBuffer = new ArrayBuffer(44 + bufferLength * 2);
  const view = new DataView(wavBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bufferLength * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, bufferLength * 2, true);

  let offset = 44;
  for (let i = 0; i < bufferLength; i += 1) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i += 1) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function mixToMonoChannel(audioBuffer) {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0);
  }

  const mixed = new Float32Array(audioBuffer.length);
  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    const channel = audioBuffer.getChannelData(channelIndex);
    for (let i = 0; i < channel.length; i += 1) {
      mixed[i] += channel[i] / audioBuffer.numberOfChannels;
    }
  }
  return mixed;
}

function resampleMonoAudio(input, sourceSampleRate, targetSampleRate) {
  if (!(input instanceof Float32Array)) {
    return new Float32Array();
  }

  if (!sourceSampleRate || !targetSampleRate || sourceSampleRate === targetSampleRate) {
    return input;
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const targetLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(targetLength);

  for (let i = 0; i < targetLength; i += 1) {
    const position = i * ratio;
    const leftIndex = Math.floor(position);
    const rightIndex = Math.min(leftIndex + 1, input.length - 1);
    const weight = position - leftIndex;
    output[i] = input[leftIndex] * (1 - weight) + input[rightIndex] * weight;
  }

  return output;
}

function createBinaryResponse(data, filename) {
  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': guessModelMime(filename),
      'Content-Length': String(data.byteLength),
    },
  });
}

function selectModelBackend(manifest) {
  const preferred = manifest.preferred_device || 'webgpu';
  if (preferred === 'webgpu' && navigator.gpu) {
    return 'webgpu';
  }
  return 'wasm';
}

function extractTranscriptText(result) {
  if (typeof result === 'string') {
    return result.trim();
  }
  return (result?.text || '').trim();
}

function formatUnknownError(error) {
  const rawMessage = extractErrorMessage(error);
  const knownHint = explainKnownAsrError(rawMessage);
  if (knownHint) {
    return `${rawMessage} ${knownHint}`;
  }

  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'number') {
    return `non-Error numeric exception: ${error}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function extractErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'number') {
    return `non-Error numeric exception: ${error}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function explainKnownAsrError(message) {
  if (!message) {
    return '';
  }

  if (
    message.includes('This is an invalid model')
    && message.includes('Subgraph output (logits) is an outer scope value being returned directly')
  ) {
    return 'This usually means the uploaded fp16 Whisper ONNX export is incompatible with the current ONNX Runtime graph validator. The browser WebGPU path itself is working; this specific fp16 model graph is invalid. Try wasm:q8, webgpu:q8, or a different fp16 export/model.';
  }

  if (
    message.includes('TransposeDQWeightsForMatMulNBits Missing required scale')
    && message.includes('weight_merged_0_scale')
  ) {
    return `This usually means the uploaded Whisper wasm:q8 export is not compatible with the ONNX Runtime version bundled by transformers.js ${TRANSFORMERS_JS_VERSION}. The q8 graph is missing quantization scale data expected by the runtime. Try wasm:int8 or wasm:uint8, or test another transformers.js version with the query parameter, for example ?transformersjs=3.8.1.`;
  }

  return '';
}

function renderScore(source, transcript) {
  const score = computeWordOverlap(source, transcript);
  scoreValue.textContent = `${Math.round(score * 100)}%`;
  scoreNote.textContent = score > 0.85
    ? 'Great match.'
    : score > 0.6
      ? 'Close. Review the missing words.'
      : 'Low overlap. Try slowing down and speaking closer to the mic.';
  scorePanel.hidden = false;
}

function renderRuntimeMetrics({ engine, backend, loadMs, transcribeMs, decodeMs = null, modelMs = null, postprocessMs = null }) {
  runtimeEngine.textContent = engine || '-';
  runtimeBackend.textContent = backend || '-';
  runtimeLoad.textContent = formatDuration(loadMs);
  runtimeTranscribe.textContent = formatDuration(transcribeMs);
  runtimeDecode.textContent = formatDuration(decodeMs);
  runtimeModel.textContent = formatDuration(modelMs);
  runtimePost.textContent = formatDuration(postprocessMs);
  runtimePanel.hidden = false;
}

function formatDuration(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms)) {
    return '-';
  }
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  return `${(ms / 1000).toFixed(1)} s`;
}

function refreshTranscribeButtonLabel() {
  transcribeButton.textContent = isOssLocalMode() ? 'Run OSS transcription' : 'Transcribe';
}

function isOssLocalMode() {
  return asrEngine.value === 'oss-local';
}

function supportsSpeechRecognition() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function computeWordOverlap(source, transcript) {
  const sourceWords = normalizeWords(source);
  const transcriptWords = new Set(normalizeWords(transcript));
  if (sourceWords.length === 0) {
    return 0;
  }
  const matched = sourceWords.filter((word) => transcriptWords.has(word)).length;
  return matched / sourceWords.length;
}

function normalizeWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function mapLanguageToLocale(languageLabel) {
  return languageLabel.toLowerCase().startsWith('english') ? 'en-US' : 'en-US';
}

function guessAudioMime(filename) {
  if (filename.endsWith('.mp3')) {
    return 'audio/mpeg';
  }
  if (filename.endsWith('.ogg')) {
    return 'audio/ogg';
  }
  return 'audio/wav';
}

function guessModelMime(filename) {
  if (filename.endsWith('.json')) {
    return 'application/json';
  }
  if (filename.endsWith('.onnx')) {
    return 'application/octet-stream';
  }
  if (filename.endsWith('.txt') || filename.endsWith('.tiktoken')) {
    return 'text/plain';
  }
  return 'application/octet-stream';
}

function resetBundleView() {
  if (activeBundle?.audioUrl) {
    URL.revokeObjectURL(activeBundle.audioUrl);
  }
  activeBundle = null;
  bundlePanel.hidden = true;
  transcribeReferenceButton.disabled = true;
  sourceText.value = '';
  referenceAudio.removeAttribute('src');
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('FileReader failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function saveToIndexedDB(key, val) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(val, key);
      request.onsuccess = () => {
        console.log(`Successfully saved ${key} to IndexedDB.`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save to IndexedDB:', error);
  }
}

async function getFromIndexedDB(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        console.log(`Successfully retrieved ${key} from IndexedDB.`);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to read from IndexedDB:', error);
    return null;
  }
}

async function deleteFromIndexedDB(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => {
        console.log(`Successfully deleted ${key} from IndexedDB.`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to delete ${key} from IndexedDB:`, error);
  }
}

async function processStudyBundle(arrayBuffer, sourceLabel) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const manifestEntry = zip.file('manifest.json');
  if (!manifestEntry) {
    throw new Error('manifest.json was not found in the bundle.');
  }

  const manifest = JSON.parse(await manifestEntry.async('string'));

  if (manifest.format === 'study-lang-mobile-asr-model-bundle/v1') {
    throw new Error('This ZIP appears to be an ASR model bundle. Please upload it under the "Choose ASR engine" -> "OSS model bundle" section below.');
  }
  
  const hasMultipleItems = Array.isArray(manifest.items) && manifest.items.length > 0;
  
  if (!hasMultipleItems && (!manifest.generated_audio_filename || !manifest.source_text)) {
    throw new Error('Invalid study bundle format. Missing generated_audio_filename or source_text in manifest.json.');
  }

  let items = [];

  if (hasMultipleItems) {
    for (let i = 0; i < manifest.items.length; i += 1) {
      const item = manifest.items[i];
      const audioEntry = zip.file(item.audio_filename);
      if (!audioEntry) {
        throw new Error(`Audio file ${item.audio_filename} not found in bundle.`);
      }
      const audioBytes = await audioEntry.async('arraybuffer');
      const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      items.push({
        text: item.source_text,
        audioBlob,
        audioUrl
      });
    }
  } else {
    const audioEntry = zip.file(manifest.generated_audio_filename);
    if (!audioEntry) {
      throw new Error(`Audio file ${manifest.generated_audio_filename} was not found in the bundle.`);
    }
    const audioBlob = new Blob([await audioEntry.async('arraybuffer')], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    items.push({
      text: manifest.source_text,
      audioBlob,
      audioUrl
    });
  }

  if (activeBundle && activeBundle.items) {
    activeBundle.items.forEach((item) => URL.revokeObjectURL(item.audioUrl));
  } else if (activeBundle && activeBundle.audioUrl) {
    URL.revokeObjectURL(activeBundle.audioUrl);
  }

  activeBundle = { 
    manifest, 
    items,
    audioBlob: items[0].audioBlob,
    audioUrl: items[0].audioUrl
  };

  bundleLanguage.textContent = manifest.language;
  bundleModel.textContent = manifest.tts_model_name;

  bundleItemSelect.innerHTML = '';
  if (hasMultipleItems) {
    items.forEach((item, idx) => {
      const option = document.createElement('option');
      option.value = String(idx);
      option.textContent = item.text.length > 50 ? item.text.substring(0, 47) + '...' : item.text;
      bundleItemSelect.appendChild(option);
    });
    bundleItemSelectorContainer.hidden = false;
  } else {
    bundleItemSelectorContainer.hidden = true;
  }

  sourceText.value = items[0].text;
  referenceAudio.src = items[0].audioUrl;
  
  bundlePanel.hidden = false;
  transcribeButton.disabled = true;
  transcribeReferenceButton.disabled = false;
  bundleStatus.textContent = `Bundle ready (${sourceLabel}).`;
  recordingStatus.textContent = 'Press “Start recording” and shadow the sample audio in English.';
}

async function initAppStorage() {
  console.log('Initializing app storage: restoring last used bundles...');
  try {
    const storedStudy = await getFromIndexedDB('studyBundle');
    if (storedStudy && storedStudy.data) {
      console.log('Restoring study bundle:', storedStudy.name);
      bundleStatus.textContent = `Restoring study bundle: ${storedStudy.name || 'bundle'}…`;
      const arrayBuffer = await readFileAsArrayBuffer(storedStudy.data);
      await processStudyBundle(arrayBuffer, 'restored from browser storage');
    } else {
      console.log('No stored study bundle found.');
    }
  } catch (error) {
    console.error('Error restoring study bundle:', error);
    bundleStatus.textContent = `Failed to restore study bundle: ${error.message}`;
  }

  try {
    const storedTtsRef = await getFromIndexedDB('ttsRefAudio');
    if (storedTtsRef && storedTtsRef.data) {
      console.log('Restoring TTS reference audio:', storedTtsRef.name);
      const file = new File([storedTtsRef.data], storedTtsRef.name, { type: storedTtsRef.data.type || 'audio/wav' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      ttsRefAudioInput.files = dataTransfer.files;
      ttsStatus.textContent = `Restored reference audio: ${storedTtsRef.name}`;
    } else {
      console.log('No stored TTS reference audio found.');
    }
  } catch (error) {
    console.error('Error restoring TTS reference audio:', error);
  }

  try {
    const storedModel = await getFromIndexedDB('modelBundle');
    if (storedModel && storedModel.data) {
      console.log('Restoring model bundle:', storedModel.name);
      modelStatus.textContent = `Restoring model bundle: ${storedModel.name || 'model'}…`;
      const arrayBuffer = await readFileAsArrayBuffer(storedModel.data);
      await processModelBundle(arrayBuffer, 'restored from browser storage');
    } else {
      console.log('No stored model bundle found.');
    }
  } catch (error) {
    console.error('Error restoring model bundle:', error);
    modelStatus.textContent = `Failed to restore model bundle: ${error.message}`;
  }

  await refreshStorageList();
}

async function handleStorageItemClick(event) {
  const deleteBtn = event.target.closest('.delete-storage-item-btn');
  if (deleteBtn) {
    const key = deleteBtn.getAttribute('data-key');
    if (!key) return;
    
    if (!confirm(`Are you sure you want to delete the saved ${key} from browser storage?`)) {
      return;
    }
    
    try {
      await deleteFromIndexedDB(key);
      console.log(`Deleted ${key} from IndexedDB.`);
      
      if (key === 'studyBundle') {
        resetBundleView();
        bundleStatus.textContent = 'No study bundle loaded.';
      } else if (key === 'modelBundle') {
        loadedLocalAsr = null;
        activeModelBundle = null;
        modelMeta.hidden = true;
        loadModelButton.disabled = true;
        modelStatus.textContent = 'No local model loaded.';
      } else if (key === 'ttsRefAudio') {
        const dataTransfer = new DataTransfer();
        ttsRefAudioInput.files = dataTransfer.files;
        ttsStatus.textContent = 'Reference audio cleared.';
      }
      
      await refreshStorageList();
    } catch (error) {
      console.error(`Failed to delete ${key} individually:`, error);
      alert(`Failed to delete item: ${error.message}`);
    }
    return;
  }

  const downloadBtn = event.target.closest('.download-storage-item-btn');
  if (downloadBtn) {
    const key = downloadBtn.getAttribute('data-key');
    if (!key) return;
    try {
      const item = await getFromIndexedDB(key);
      if (item && item.data) {
        const url = URL.createObjectURL(item.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name || `${key}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`Downloaded ${key} from IndexedDB:`, item.name);
      } else {
        alert('File data not found in browser storage.');
      }
    } catch (error) {
      console.error('Failed to download item:', error);
      alert(`Failed to download item: ${error.message}`);
    }
  }
}

async function handleClearStorage() {
  if (!confirm('Are you sure you want to clear all saved study bundles and model bundles from this browser?')) {
    return;
  }

  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    console.log('Successfully cleared all persisted data from IndexedDB.');
    alert('Browser storage has been cleared. The page will reload now.');
    window.location.reload();
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
    alert(`Failed to clear storage: ${error.message}`);
  }
}

async function refreshStorageList() {
  if (!storageListContainer) return;

  try {
    const studyBundle = await getFromIndexedDB('studyBundle');
    const modelBundle = await getFromIndexedDB('modelBundle');
    const ttsRefAudio = await getFromIndexedDB('ttsRefAudio');

    let html = '<ul class="storage-list">';
    
    if (studyBundle && studyBundle.data) {
      const sizeStr = formatBytes(studyBundle.data.size);
      html += `<li class="storage-item">
        <span><strong>Study Bundle:</strong> ${studyBundle.name || 'Unnamed'} (${sizeStr})</span>
        <div class="storage-item-btn-container">
          <button type="button" class="download-storage-item-btn" data-key="studyBundle">Download</button>
          <button type="button" class="delete-storage-item-btn" data-key="studyBundle">Delete</button>
        </div>
      </li>`;
    } else {
      html += `<li class="storage-item empty">
        <span><strong>Study Bundle:</strong> None</span>
      </li>`;
    }

    if (ttsRefAudio && ttsRefAudio.data) {
      const sizeStr = formatBytes(ttsRefAudio.data.size);
      html += `<li class="storage-item">
        <span><strong>TTS Reference Audio:</strong> ${ttsRefAudio.name || 'Unnamed'} (${sizeStr})</span>
        <div class="storage-item-btn-container">
          <button type="button" class="download-storage-item-btn" data-key="ttsRefAudio">Download</button>
          <button type="button" class="delete-storage-item-btn" data-key="ttsRefAudio">Delete</button>
        </div>
      </li>`;
    } else {
      html += `<li class="storage-item empty">
        <span><strong>TTS Reference Audio:</strong> None</span>
      </li>`;
    }

    if (modelBundle && modelBundle.data) {
      const sizeStr = formatBytes(modelBundle.data.size);
      html += `<li class="storage-item">
        <span><strong>Model Bundle:</strong> ${modelBundle.name || 'Unnamed'} (${sizeStr})</span>
        <div class="storage-item-btn-container">
          <button type="button" class="download-storage-item-btn" data-key="modelBundle">Download</button>
          <button type="button" class="delete-storage-item-btn" data-key="modelBundle">Delete</button>
        </div>
      </li>`;
    } else {
      html += `<li class="storage-item empty">
        <span><strong>Model Bundle:</strong> None</span>
      </li>`;
    }

    html += '</ul>';
    storageListContainer.innerHTML = html;
  } catch (error) {
    console.error('Failed to refresh storage list:', error);
    storageListContainer.textContent = 'Failed to load storage list.';
  }
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function renderComparison() {
  const source = sourceText.value;
  const target = transcriptText.value;
  if (!source || !target) {
    alert('Please load a study bundle and run transcription first.');
    return;
  }

  const { sourceDiff, targetDiff } = diffWords(source, target);

  const comparisonSourceEl = document.querySelector('#comparison-source');
  const comparisonTargetEl = document.querySelector('#comparison-target');
  const comparisonPanel = document.querySelector('#comparison-panel');

  if (!comparisonSourceEl || !comparisonTargetEl || !comparisonPanel) {
    console.error('Comparison UI elements not found.');
    return;
  }

  comparisonSourceEl.innerHTML = sourceDiff.map(item => {
    if (item.type === 'deleted') {
      return `<span style="color: #ff8ea1; text-decoration: line-through; margin-right: 4px;">${escapeHtml(item.word)}</span>`;
    }
    return `<span style="margin-right: 4px;">${escapeHtml(item.word)}</span>`;
  }).join(' ');

  comparisonTargetEl.innerHTML = targetDiff.map(item => {
    if (item.type === 'inserted') {
      return `<span style="background-color: rgba(255, 77, 106, 0.25); color: #ff8ea1; border-bottom: 2px dashed #ff4d6a; margin-right: 4px; padding: 0 2px; border-radius: 4px;">${escapeHtml(item.word)}</span>`;
    }
    return `<span style="color: #82f7b4; margin-right: 4px;">${escapeHtml(item.word)}</span>`;
  }).join(' ');

  comparisonPanel.hidden = false;
}

function diffWords(sourceText, targetText) {
  const sourceWords = sourceText.trim().replace(/[^a-zA-Z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);
  const targetWords = targetText.trim().replace(/[^a-zA-Z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);

  const n = sourceWords.length;
  const m = targetWords.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      if (sourceWords[i - 1].toLowerCase() === targetWords[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = n;
  let j = m;
  const sourceDiff = [];
  const targetDiff = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && sourceWords[i - 1].toLowerCase() === targetWords[j - 1].toLowerCase()) {
      sourceDiff.unshift({ word: sourceWords[i - 1], type: 'match' });
      targetDiff.unshift({ word: targetWords[j - 1], type: 'match' });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      targetDiff.unshift({ word: targetWords[j - 1], type: 'inserted' });
      j -= 1;
    } else {
      sourceDiff.unshift({ word: sourceWords[i - 1], type: 'deleted' });
      i -= 1;
    }
  }

  return { sourceDiff, targetDiff };
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function checkTtsApiAvailability() {
  if (!ttsDetails) return;
  try {
    const response = await fetch('/api/generate-bundle');
    if (response.status === 200) {
      console.log('TTS API server is active.');
      if (ttsOfflineMessage) ttsOfflineMessage.hidden = true;
      ttsDetails.open = true;
    } else {
      throw new Error(`API returned status ${response.status}`);
    }
  } catch (error) {
    console.warn('TTS API is offline or invalid:', error);
    ttsDetails.open = false;
    if (ttsOfflineMessage) {
      ttsOfflineMessage.hidden = false;
    }
  }
}

async function saveHfModelAsZip() {
  if (downloadedHfFiles.size === 0) {
    alert('No downloaded model files found in memory. Please download/load the model first.');
    return;
  }

  saveModelZipButton.disabled = true;
  const oldText = saveModelZipButton.textContent;
  saveModelZipButton.textContent = 'Packaging model ZIP...';

  try {
    const zip = new JSZip();
    const manifest = {
      format: "study-lang-mobile-asr-model-bundle/v1",
      engine: "transformers.js",
      task: "automatic-speech-recognition",
      model_id: activeHfModelId || "whisper-model",
      preferred_device: navigator.gpu ? "webgpu" : "wasm",
      dtype: navigator.gpu ? "fp32" : "uint8",
      variants: [
        {
          preferred_device: "webgpu",
          dtype: "fp32"
        },
        {
          preferred_device: "wasm",
          dtype: "uint8"
        }
      ]
    };

    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    for (const [relPath, buffer] of downloadedHfFiles.entries()) {
      zip.file(relPath, buffer);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const cleanModelName = (activeHfModelId || "whisper").replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `mobile_asr_model_bundle_${cleanModelName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    modelStatus.textContent = `Successfully packaged and downloaded model ZIP! (${downloadedHfFiles.size} files)`;
  } catch (error) {
    console.error(error);
    alert(`Failed to create ZIP: ${error.message}`);
  } finally {
    saveModelZipButton.disabled = false;
    saveModelZipButton.textContent = oldText;
  }
}
