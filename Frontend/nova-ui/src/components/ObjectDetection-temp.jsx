
import { useEffect, useRef, useState } from "react";

const MIN_SCORE = 0.5;
const MAX_DETECTIONS = 20;
const LIST_REFRESH_MS = 300;
const IDLE_TEXT = "Camera is inactive. Click ⏻ to start.";

let modelPromise = null;

function loadModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [tf, cocoSsd] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/coco-ssd"),
      ]);

      await tf.ready();
      return cocoSsd.load({ base: "lite_mobilenet_v2" });
    })().catch((error) => {
      modelPromise = null;
      throw error;
    });
  }

  return modelPromise;
}

function cameraErrorMessage(error) {
  switch (error?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera permission was denied. Allow camera access in browser site settings.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device.";
    case "NotReadableError":
      return "The camera is being used by another application or cannot be opened.";
    default:
      return "Could not start the camera.";
  }
}

function drawDetections(canvas, video, predictions) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cw = Math.round(rect.width * dpr);
  const ch = Math.round(rect.height * dpr);

  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, cw, ch);

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  if (!vw || !vh || !cw || !ch) return;

  const scale = Math.max(cw / vw, ch / vh);
  const offsetX = (cw - vw * scale) / 2;
  const offsetY = (ch - vh * scale) / 2;

  ctx.lineWidth = 2 * dpr;
  ctx.font = `${11 * dpr}px "Share Tech Mono", monospace`;
  ctx.textBaseline = "top";

  for (const prediction of predictions) {
    const [x, y, w, h] = prediction.bbox;
    const boxW = w * scale;
    const boxH = h * scale;
    const boxX = cw - (x * scale + offsetX) - boxW;
    const boxY = y * scale + offsetY;

    ctx.strokeStyle = "#ff2222";
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    const label = `${prediction.class} ${Math.round(
      prediction.score * 100
    )}%`;

    const labelW = ctx.measureText(label).width + 8 * dpr;
    const labelH = 16 * dpr;
    const labelX = Math.min(
      Math.max(boxX, 0),
      Math.max(cw - labelW, 0)
    );
    const labelY = boxY - labelH >= 0 ? boxY - labelH : boxY;

    ctx.fillStyle = "rgba(255, 34, 34, 0.9)";
    ctx.fillRect(labelX, labelY, labelW, labelH);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, labelX + 4 * dpr, labelY + 3 * dpr);
  }
}

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

export default function ObjectDetection({ enabled, onEnabledChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const onEnabledChangeRef = useRef(onEnabledChange);

  const [phase, setPhase] = useState("starting");
  const [error, setError] = useState("");
  const [detections, setDetections] = useState([]);

  useEffect(() => {
    onEnabledChangeRef.current = onEnabledChange;
  }, [onEnabledChange]);

  useEffect(() => {
    if (!enabled) return undefined;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    let cancelled = false;
    let stream = null;

    const fail = (message, cause) => {
      if (cancelled) return;

      if (cause) {
        console.error("NOVA camera:", cause);
      }

      setError(message);
      onEnabledChangeRef.current?.(false);
    };

    const detectLoop = async (model) => {
      let lastListUpdate = 0;

      while (!cancelled) {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          let predictions;

          try {
            predictions = await model.detect(
              video,
              MAX_DETECTIONS,
              MIN_SCORE
            );
          } catch (cause) {
            fail(
              "Object detection stopped because of an error. Click the camera power button to restart.",
              cause
            );
            return;
          }

          if (cancelled) return;

          drawDetections(canvas, video, predictions);

          const now = performance.now();

          if (now - lastListUpdate >= LIST_REFRESH_MS) {
            lastListUpdate = now;

            const byClass = new Map();

            for (const prediction of predictions) {
              const percent = Math.round(prediction.score * 100);
              const row = byClass.get(prediction.class);

              if (!row) {
                byClass.set(prediction.class, {
                  label: prediction.class,
                  percent,
                  count: 1,
                });
              } else {
                row.count += 1;
                row.percent = Math.max(row.percent, percent);
              }
            }

            setDetections(
              [...byClass.values()]
                .sort((a, b) => b.percent - a.percent)
                .slice(0, 5)
            );
          }
        }

        await nextFrame();
      }
    };

    const run = async () => {
      setError("");
      setPhase("starting");
      setDetections([]);

      if (!navigator.mediaDevices?.getUserMedia) {
        fail(
          "Camera access requires HTTPS or localhost and a supported browser."
        );
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch (cause) {
        fail(cameraErrorMessage(cause), cause);
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;

      try {
        await video.play();
      } catch (cause) {
        fail("Could not display the camera feed.", cause);
        return;
      }

      if (cancelled) return;

      setPhase("loading");

      let model;

      try {
        model = await loadModel();
      } catch (cause) {
        fail(
          "Could not load the object-detection model. Check your internet connection and try again.",
          cause
        );
        return;
      }

      if (cancelled) return;

      setPhase("running");
      await detectLoop(model);
    };

    run();

    return () => {
      cancelled = true;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (video) video.srcObject = null;

      const ctx = canvas?.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [enabled]);

  let label = IDLE_TEXT;

  if (error) {
    label = error;
  } else if (enabled && phase === "starting") {
    label = "Starting camera…";
  } else if (enabled && phase === "loading") {
    label = "Loading detection model…";
  } else if (enabled) {
    label = "Detecting objects in real time.";
  }

  return (
    <>
      <div className="camera-feed">
        <video
          ref={videoRef}
          className={`camera-video${enabled ? " live" : ""}`}
          autoPlay
          muted
          playsInline
        />

        <canvas ref={canvasRef} className="camera-canvas" />

        <div className="camera-corner tl" />
        <div className="camera-corner tr" />
        <div className="camera-corner bl" />
        <div className="camera-corner br" />

        {!enabled && <span className="camera-off">Camera Off</span>}
      </div>

      <div
        className={`camera-label${error ? " error" : ""}`}
        role="status"
        aria-live="polite"
      >
        {label}
      </div>

      {enabled && phase === "running" && detections.length > 0 && (
        <ul className="detect-list">
          {detections.map((item) => (
            <li key={item.label}>
              <span>
                {item.label}
                {item.count > 1 ? ` ×${item.count}` : ""}
              </span>

              <span className="detect-pct">{item.percent}%</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
