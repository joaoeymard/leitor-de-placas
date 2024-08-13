const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const output = document.getElementById("output");
const cameraSelect = document.getElementById("cameraSelect");

let processing = false;
let captureInterval;
const detectedPlates = new Set();

// Configuração ajustável
const captureFrequency = 500; // Frequência de captura em milissegundos

navigator.mediaDevices.enumerateDevices().then((devices) => {
  const videoDevices = devices.filter((device) => device.kind === "videoinput");

  // Preencher o dropdown com as câmeras
  videoDevices.forEach((device) => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.text = device.label || `Câmera ${cameraSelect.length + 1}`;
    cameraSelect.appendChild(option);
  });

  // Quando o usuário escolher uma câmera, capturar o vídeo dessa câmera
  cameraSelect.onchange = () => {
    startStream(cameraSelect.value);
  };

  // Iniciar com a primeira câmera por padrão
  if (videoDevices.length > 0) {
    startStream(videoDevices[0].deviceId);
  }
});

// Acessar a câmera e iniciar o stream
function startStream(deviceId) {
  navigator.mediaDevices
    .getUserMedia({ video: { deviceId: { exact: deviceId } } })
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
  setResolution({ width: 1080, height: 720, facingMode: "environment" });

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

    // Aplicar pré-processamento na imagem
    applyPreprocessing(context);

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

// Função para aplicar pré-processamento na imagem
function applyPreprocessing(context) {
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Converter para escala de cinza e aumentar o contraste
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg > 128 ? 255 : 0; // Binarização simples
    data[i + 1] = avg > 128 ? 255 : 0;
    data[i + 2] = avg > 128 ? 255 : 0;
  }

  context.putImageData(imageData, 0, 0);
}
