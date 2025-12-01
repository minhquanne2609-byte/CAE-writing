import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Clock, Check } from 'lucide-react';

export const ExamTimer: React.FC = () => {
  // Default to 40 minutes based on user request
  const DEFAULT_TIME = 40 * 60;
  
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMinutes, setEditMinutes] = useState('40');
  const [initialTime, setInitialTime] = useState(DEFAULT_TIME);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialTime);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(editMinutes);
    if (!isNaN(minutes) && minutes > 0) {
      const newSeconds = minutes * 60;
      setInitialTime(newSeconds);
      setTimeLeft(newSeconds);
      setIsEditing(false);
      setIsActive(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Visual urgency state
  const isLowTime = timeLeft < 300 && timeLeft > 0; // Less than 5 mins

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold flex items-center text-slate-800">
          <Clock className="w-5 h-5 mr-2 text-teal-600" />
          Task Timer
        </h2>
      </div>
      
      <p className="text-xs text-slate-500 mb-4 italic">
        Suggested time for each part is 40 mins
      </p>

      <div className="flex flex-col items-center justify-center py-2">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="flex items-center space-x-2 mb-4 h-16">
            <div className="flex flex-col items-center">
              <label className="text-xs text-slate-500 mb-1 font-semibold uppercase">Set Minutes</label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="w-20 text-center text-3xl font-mono font-bold border-b-2 border-teal-500 focus:outline-none text-slate-800"
                  autoFocus
                />
                <span className="text-slate-400 font-mono text-xl ml-1">m</span>
              </div>
            </div>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-full transition-colors mt-4"
              title="Save Time"
            >
              <Check className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <div className={`text-6xl font-mono font-bold mb-6 tabular-nums tracking-tight ${isLowTime ? 'text-orange-600 animate-pulse' : 'text-slate-800'}`}>
            {formatTime(timeLeft)}
          </div>
        )}

        <div className="flex items-center gap-4">
          {!isEditing && (
            <>
              <button
                onClick={toggleTimer}
                className={`flex items-center justify-center w-14 h-14 rounded-full shadow-md transition-all ${
                  isActive 
                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-2 border-orange-200' 
                    : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-lg hover:scale-105'
                }`}
                title={isActive ? "Pause" : "Start"}
              >
                {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>

              <button
                onClick={resetTimer}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setIsActive(false);
            }}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              isEditing 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
            }`}
            title="Edit Duration"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};