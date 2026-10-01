const talkButton = document.getElementById("talkButton");
const finishButton = document.getElementById("finishButton");
const stopButton = document.getElementById("stopButton");
const status = document.getElementById("status");
const transcription = document.getElementById("transcription");

let microphoneStream = null;
let audioContext = null;
let analyser = null;
let animationFrame = null;
let mediaRecorder = null;
let audioChunks = [];

function stopAudioAnalysis() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  analyser = null;
}

function stopMicrophoneTracks() {
  if (microphoneStream) {
    microphoneStream.getTracks().forEach(track => track.stop());
    microphoneStream = null;
  }
}

function monitorMicrophone() {
  if (!analyser) return;

  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);

  const average =
    data.reduce((sum, value) => sum + value, 0) / data.length;

  status.textContent =
    `🎙 Enregistrement — niveau audio : ${Math.round(average)}`;

  animationFrame = requestAnimationFrame(monitorMicrophone);
}

talkButton.addEventListener("click", async () => {
  try {
    status.textContent = "Demande d'accès au microphone…";

    microphoneStream =
      await navigator.mediaDevices.getUserMedia({ audio: true });

    audioContext = new AudioContext();

    const source =
      audioContext.createMediaStreamSource(microphoneStream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    source.connect(analyser);

    audioChunks = [];

    mediaRecorder = new MediaRecorder(microphoneStream);

    mediaRecorder.addEventListener("dataavailable", event => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    });

    mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(audioChunks, {
        type: mediaRecorder.mimeType
      });

      const audioUrl = URL.createObjectURL(audioBlob);

      transcription.innerHTML = "";

      const message = document.createElement("p");
      message.textContent =
        "Enregistrement local terminé. Réécoute :";

      const audioPlayer = document.createElement("audio");
      audioPlayer.controls = true;
      audioPlayer.src = audioUrl;

      transcription.appendChild(message);
      transcription.appendChild(audioPlayer);

      stopAudioAnalysis();
      stopMicrophoneTracks();

      status.textContent = "Enregistrement terminé — prêt.";

      talkButton.disabled = false;
      finishButton.disabled = true;
    });

    mediaRecorder.start();

    talkButton.disabled = true;
    finishButton.disabled = false;

    monitorMicrophone();

  } catch (error) {
    console.error(error);

    status.textContent =
      "❌ Impossible d'accéder au microphone.";

    stopAudioAnalysis();
    stopMicrophoneTracks();

    talkButton.disabled = false;
    finishButton.disabled = true;
  }
});

finishButton.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    status.textContent = "Finalisation de l'enregistrement…";
    mediaRecorder.stop();
  }
});

stopButton.addEventListener("click", () => {
  status.textContent = "Réponse interrompue.";
});
