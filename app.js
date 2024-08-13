const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const output = document.getElementById("output");
const cameraSelect = document.getElementById("cameraSelect");
const selectedCamera = document.getElementById("selectedCamera");
const toggleCamera = document.getElementById("toggleCamera");

let type = "user";
let processing = false;
let captureInterval;

// Configuração ajustável
const captureFrequency = 200; // Frequência de captura em milissegundos

navigator.mediaDevices.enumerateDevices().then((devices) => {
  const videoDevices = devices.filter((device) => device.kind === "videoinput");

  // Preencher o dropdown com as câmeras
  videoDevices.forEach((device) => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.text = device.label || `Câmera ${cameraSelect.length + 1}`;
    cameraSelect.appendChild(option);
  });
});

selectedCamera.addEventListener("click", () => {
  startStream({ deviceId: cameraSelect.value });
});

toggleCamera.addEventListener("click", () => {
  type = type === "user" ? "environment" : "user";
  startStream({ facingMode: type });
});

// Acessar a câmera e iniciar o stream
function startStream(options) {
  navigator.mediaDevices
    .getUserMedia({ audio: false, video: { ...options } })
    .then((stream) => {
      video.srcObject = stream;
      video.addEventListener("play", startProcessing);
    })
    .catch((err) => {
      console.error("Error accessing the camera: ", err);
    });
}

function startProcessing() {
  // Configurar a resolução do canvas
  setResolution({
    width: video.width,
    height: video.height,
  });

  // Configurar o intervalo de captura
  if (captureInterval) clearInterval(captureInterval);
  captureInterval = setInterval(processFrame, captureFrequency);
}

function setResolution(resolution) {
  canvas.width = resolution.width;
  canvas.height = resolution.height;
}

function processFrame() {
  if (!processing) {
    processing = true;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/png");

    // Usar Tesseract.js para reconhecimento de texto
    Tesseract.recognize(imageData, "eng")
      .then(({ data: { text } }) => {
        // Exibir o texto reconhecido diretamente
        output.innerText = `Texto Reconhecido: ${text}`;
        processing = false;
      })
      .catch((err) => {
        console.error("Error during text recognition: ", err);
        processing = false;
      });
  }
}
