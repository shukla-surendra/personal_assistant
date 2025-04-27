import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const MODES = {
  pomodoro: "Pomodoro",
  short: "Short Break",
  long: "Long Break",
};

const MODE_COLORS = {
  [MODES.pomodoro]: "#ef4444", // red-500
  [MODES.short]: "#22c55e", // green-500
  [MODES.long]: "#3b82f6", // blue-500
};

export default function PomodoroApp() {
  const [mode, setMode] = useState(MODES.pomodoro);
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(pomodoroTime * 60);
  const [isMuted, setIsMuted] = useState(false);
  const alertSound = new Audio("/alerts/alert.mp3");
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(getDurationByMode(mode) * 60);
    }
  }, [mode]);

  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(getDurationByMode(mode) * 60);
    }
  }, [pomodoroTime, shortBreakTime, longBreakTime]);

  useEffect(() => {
    let timer;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      if (!isMuted) {
        alertSound.play();
      }

      if (Notification.permission === "granted") {
        new Notification(`${mode} finished`, {
          body: mode === MODES.pomodoro ? "Time for a break!" : "Back to work!",
        });
      }

      setHistory((prev) => [
        ...prev,
        { mode, completedAt: new Date().toISOString() },
      ]);

      if (mode === MODES.pomodoro) {
        setCompletedPomodoros((prev) => prev + 1);
        if ((completedPomodoros + 1) % 4 === 0) {
          setMode(MODES.long);
        } else {
          setMode(MODES.short);
        }
      } else {
        setMode(MODES.pomodoro);
      }

      setIsRunning(false);
    }

    return () => clearInterval(timer);
  }, [isRunning, secondsLeft, isMuted]);

  useEffect(() => {
    const min = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const sec = (secondsLeft % 60).toString().padStart(2, "0");
    document.title = `${min}:${sec} ${isRunning ? "⏳" : "⏸️"} ${mode}`;
  }, [secondsLeft, isRunning, mode]);

  const getDurationByMode = (m) => {
    if (m === MODES.pomodoro) return pomodoroTime;
    if (m === MODES.short) return shortBreakTime;
    return longBreakTime;
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(getDurationByMode(mode) * 60);
  };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const progress =
    (100 * (getDurationByMode(mode) * 60 - secondsLeft)) /
    (getDurationByMode(mode) * 60);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div 
          className="h-2 transition-colors duration-300"
          style={{ backgroundColor: MODE_COLORS[mode] }}
        />
        
        <div className="p-8">
          <div className="flex justify-center space-x-2 mb-8">
            {Object.values(MODES).map((m) => (
              <motion.button
                key={m}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  m === mode
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={{
                  backgroundColor: m === mode ? MODE_COLORS[m] : "transparent",
                }}
                onClick={() => {
                  setMode(m);
                  setIsRunning(false);
                }}
              >
                {m}
              </motion.button>
            ))}
          </div>

          <motion.div 
            className="text-center mb-8"
            animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{mode} Timer</h1>
            <div className="text-6xl font-bold" style={{ color: MODE_COLORS[mode] }}>
              {minutes}:{seconds}
            </div>
          </motion.div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
            <motion.div
              className="h-2.5 rounded-full transition-colors duration-300"
              style={{ 
                width: `${progress}%`,
                backgroundColor: MODE_COLORS[mode]
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <div className="flex justify-center space-x-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg font-medium text-white ${
                isRunning ? "bg-yellow-500" : "bg-green-500"
              }`}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? "Pause" : "Start"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg font-medium bg-gray-500 text-white"
              onClick={handleReset}
            >
              Reset
            </motion.button>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pomodoro (min)
              </label>
              <input
                type="number"
                min={1}
                value={pomodoroTime}
                onChange={(e) => setPomodoroTime(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Break (min)
              </label>
              <input
                type="number"
                min={1}
                value={shortBreakTime}
                onChange={(e) => setShortBreakTime(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Long Break (min)
              </label>
              <input
                type="number"
                min={1}
                value={longBreakTime}
                onChange={(e) => setLongBreakTime(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg font-medium text-white ${
                isMuted ? "bg-red-500" : "bg-green-500"
              }`}
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? "Unmute 🔇" : "Mute 🔔"}
            </motion.button>
          </div>

          {mode === MODES.pomodoro && (
            <p className="text-center text-gray-600 mt-4">
              Long break in {4 - (completedPomodoros % 4)} Pomodoros
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
