import "./styles.css";
import jsQR from "jsqr";

const state = {
  date: new Date(),
  link: "",
  enableScan: true,
  color: "#FF3B58"
};

let video;
let canvasElement;
let canvas;
let loadingMessage;
let outputMessage;
let outputData;
let scanBtn;
let preloaderScan;

registerDomElements();
addEvListener();
startScanner();

function addEvListener() {
  scanBtn.addEventListener("click", startScanner);
}

function endScan() {
  scanBtn.innerText = "Scan again";
  scanBtn.className = "btn btn-primary mb-1";
  scanBtn.disabled = state.enableScan = false;
  preloaderScan.className = "preloader-scanned";
}

function registerDomElements() {
  video = document.createElement("video");
  canvasElement = document.getElementById("canvas");
  canvas = canvasElement.getContext("2d");
  loadingMessage = document.getElementById("loadingMessage");
  outputMessage = document.getElementById("outputMessage");
  outputData = document.getElementById("outputData");
  preloaderScan = document.querySelector(".preloader-scan");
  scanBtn = document.getElementById("scan");
}

function drawLine(begin, end, color) {
  canvas.beginPath();
  canvas.moveTo(begin.x, begin.y);
  canvas.lineTo(end.x, end.y);
  canvas.lineWidth = 4;
  canvas.strokeStyle = color;
  canvas.stroke();
}

function startScanner() {
  scanBtn.innerText = "Scanning...";
  scanBtn.className = "btn btn-info mb-1";
  state.enableScan = true;

  // Use facingMode: environment to attemt to get the front camera on phones
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(function(stream) {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      video.play();
      requestAnimationFrame(tick);
    });
  preloaderScan.className = "preloader-scan";
}

function tick() {
  if (!state.enableScan) return;
  loadingMessage.innerText = "⌛ Loading video...";
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    loadingMessage.hidden = true;
    canvasElement.hidden = false;

    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
    const imageData = canvas.getImageData(
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert"
    });
    if (code) {
      drawLine(
        code.location.topLeftCorner,
        code.location.topRightCorner,
        state.color
      );
      drawLine(
        code.location.topRightCorner,
        code.location.bottomRightCorner,
        state.color
      );
      drawLine(
        code.location.bottomRightCorner,
        code.location.bottomLeftCorner,
        state.color
      );
      drawLine(
        code.location.bottomLeftCorner,
        code.location.topLeftCorner,
        state.color
      );
      if (outputMessage) outputMessage.hidden = true;
      outputData.parentElement.hidden = false;
      outputData.innerText = code.data;

      if (code.data && code.data.includes("https:")) {
        outputData.innerText = "";

        var link = document.createElement("a");
        state.link = link.innerText = link.href = code.data;
        link.className = "badge badge-primary p-2";
        outputData.appendChild(link);
        // outputData.innerText = code.data;
        endScan();
      }
    } else {
      state.link = "";
      state.enableScan = true;
      scanBtn.disabled = true;
      //scanBtn.setAttribute("disabled", "");
      if (outputMessage) outputMessage.hidden = false;
      outputData.parentElement.hidden = true;
    }
  }
  requestAnimationFrame(tick);
}
