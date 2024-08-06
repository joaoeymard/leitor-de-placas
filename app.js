const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const output = document.getElementById("output");
let processing = false;
let captureInterval;
const detectedPlates = new Set();

// Configuração ajustável
const captureFrequency = 500; // Frequência de captura em milissegundos

// Acessar a câmera
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    video.addEventListener("play", startProcessing);
  })
  .catch((err) => {
    console.error("Error accessing the camera: ", err);
  });

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
        const sanitizedText = sanitizeText(text);

        const plates = findPlates(sanitizedText);
        plates.forEach((plate) => detectedPlates.add(plate));
        updateOutput();
        processing = false;
      })
      .catch((err) => {
        console.error("Error during text recognition: ", err);
        processing = false;
      });
  }
}

// Função para sanitizar o texto lido
function sanitizeText(text) {
  return text.replace(/[^A-Z0-9\s]/gi, "");
}

// Função para localizar o padrão de uma placa de carro brasileiro no texto
function findPlates(text) {
  // Padrão para placas no formato antigo (AAA-1234) e novo (ABC1D23)
  const platePattern = /\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2})\b/g;
  const matches = text.match(platePattern);
  return matches || [];
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

// Função para atualizar a saída com as placas detectadas
function updateOutput() {
  output.innerText = `Detected Plates: ${Array.from(detectedPlates).join(
    ", "
  )}`;
}
