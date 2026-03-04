// services/camera.js — Camera capture (ES module)

let stream = null;
let devices = [];
let currentIdx = 0;

export async function start(deviceId) {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  const constraints = deviceId
    ? { video: { deviceId: { exact: deviceId } } }
    : { video: { facingMode: 'environment' } };
  stream = await navigator.mediaDevices.getUserMedia(constraints);
  const allDevices = await navigator.mediaDevices.enumerateDevices();
  devices = allDevices.filter(d => d.kind === 'videoinput');
  return stream;
}

export function stop(videoEl) {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  if (videoEl) videoEl.srcObject = null;
}

export function snap(videoEl, canvasEl) {
  const w = videoEl.videoWidth, h = videoEl.videoHeight;
  canvasEl.width = w; canvasEl.height = h;
  canvasEl.getContext('2d').drawImage(videoEl, 0, 0, w, h);
  return canvasEl.toDataURL('image/jpeg', 0.85);
}

export async function switchCamera() {
  if (devices.length < 2) return null;
  currentIdx = (currentIdx + 1) % devices.length;
  return start(devices[currentIdx].deviceId);
}

export function getDevices() { return devices; }
export function isActive() { return !!stream; }
export function getStream() { return stream; }
