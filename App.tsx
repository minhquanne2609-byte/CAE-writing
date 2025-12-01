import React, { useState, useMemo, useEffect } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { BookOpen, AlertCircle, CheckCircle2, FileText, PenTool, Sparkles, Loader2, Send, ChevronUp, ChevronDown, Wand2, History as HistoryIcon, RefreshCw, Trash2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { TASK_TYPES, SCALES } from './constants';
import { AssessmentCard } from './components/AssessmentCard';
import { InfoTooltip } from './components/InfoTooltip';
import { ExamTimer } from './components/ExamTimer';
import { HistoryList } from './components/HistoryList';
import { ScoreState, TaskType, GeneratedTask, AssessmentFeedback, ImprovedResponse, HistoryEntry } from './types';

// Authentic C1 Advanced topics
const C1_TOPICS = [
  "Urban Traffic and Transport Policies",
  "Funding for Local Facilities (Sports vs Arts)",
  "School Curriculum Changes",
  "Work-Life Balance and Remote Working",
  "Environmental Responsibility in Towns",
  "Youth Unemployment Solutions",
  "Preserving Local History vs Modernisation",
  "The Role of Museums and Libraries",
  "Healthy Eating Initiatives",
  "University Funding and Tuition",
  "Public Transport Improvements",
  "Supporting Local Businesses",
  "Technology in Classrooms",
  "Sports Facilities in Towns",
  "Charity and Community Service"
];

function App() {
  // --- THEME LOGIC ---
  const isChristmas = useMemo(() => {
    // Active until Dec 31, 2025
    return new Date() < new Date('2025-12-31T23:59:59');
  }, []);

  // --- STATE INITIALIZATION WITH PERSISTENCE ---

  // 1. Task History (Last 5 generated tasks)
  const [taskHistory, setTaskHistory] = useState<GeneratedTask[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('c1_task_history');
        return saved ? JSON.parse(saved) : [];
      } catch (e) { return []; }
    }
    return [];
  });

  // 2. Current Session (Draft text, active task, type)
  const loadSession = () => {
    if (typeof window !== 'undefined') {
      try {
        const savedSession = localStorage.getItem('c1_current_session');
        if (savedSession) {
          return JSON.parse(savedSession);
        }
      } catch (e) { console.error("Session load error", e); }
    }
    return null;
  };

  const initialSession = loadSession();

  const [taskType, setTaskType] = useState<TaskType>(initialSession?.taskType || 'Essay');
  const [studentText, setStudentText] = useState(initialSession?.studentText || '');
  const [generatedTask, setGeneratedTask] = useState<GeneratedTask | null>(initialSession?.generatedTask || null);

  const [activeTab, setActiveTab] = useState<'draft' | 'improved'>('draft');
  
  const [scores, setScores] = useState<ScoreState>({
    content: 0,
    communicative: 0,
    organisation: 0,
    language: 0
  });
  const [feedback, setFeedback] = useState<AssessmentFeedback | null>(null);
  const [improvedResponse, setImprovedResponse] = useState<ImprovedResponse | null>(null);
  
  // 3. Assessment History (Completed evaluations)
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('c1_writing_history');
        if (saved) {
          return JSON.parse(saved).map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
        }
      } catch (error) {
        console.error("Failed to load history:", error);
      }
    }
    return [];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isScoreCollapsed, setIsScoreCollapsed] = useState(false);

  // --- PERSISTENCE EFFECTS ---

  useEffect(() => {
    localStorage.setItem('c1_task_history', JSON.stringify(taskHistory));
  }, [taskHistory]);

  useEffect(() => {
    localStorage.setItem('c1_writing_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const sessionData = {
      taskType,
      studentText,
      generatedTask
    };
    localStorage.setItem('c1_current_session', JSON.stringify(sessionData));
  }, [taskType, studentText, generatedTask]);


  // --- COMPUTED VALUES ---

  const wordCount = useMemo(() => {
    const textToCount = activeTab === 'draft' ? studentText : (improvedResponse?.rewrittenText || '');
    return textToCount.trim() === '' ? 0 : textToCount.trim().split(/\s+/).length;
  }, [studentText, improvedResponse, activeTab]);

  const totalScore = scores.content + scores.communicative + scores.organisation + scores.language;

  const chartData = [
    { subject: 'Content', A: scores.content, fullMark: 5 },
    { subject: 'Comm. Achiev.', A: scores.communicative, fullMark: 5 },
    { subject: 'Organisation', A: scores.organisation, fullMark: 5 },
    { subject: 'Language', A: scores.language, fullMark: 5 },
  ];

  const getWordCountColor = () => {
    if (wordCount === 0) return 'text-slate-400';
    if (wordCount >= 220 && wordCount <= 260) return 'text-green-600 font-bold';
    return 'text-orange-500 font-medium';
  };

  // --- HANDLERS ---

  const handleTaskTypeChange = (newType: TaskType) => {
    setTaskType(newType);
    if (generatedTask && generatedTask.type !== newType) {
       setGeneratedTask(null); 
    }
    setFeedback(null);
    setImprovedResponse(null);
    setActiveTab('draft');
    setScores({ content: 0, communicative: 0, organisation: 0, language: 0 });
  };

  const handleGenerateTask = async () => {
    setIsGenerating(true);
    setFeedback(null);
    setImprovedResponse(null);
    setActiveTab('draft');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const randomTopic = C1_TOPICS[Math.floor(Math.random() * C1_TOPICS.length)];

      let prompt = '';
      let schemaProperties: any = {
        context: { type: Type.STRING },
        question: { type: Type.STRING },
        points: { type: Type.ARRAY, items: { type: Type.STRING } },
        instructions: { type: Type.STRING }
      };
      let requiredFields = ["context", "question", "points", "instructions"];

      if (taskType === 'Essay') {
        prompt = `Generate a Cambridge C1 Advanced (CAE) Writing Part 1 Essay task about: "${randomTopic}".
        Structure:
        1. Context: Brief scene setting.
        2. Question: Practical policy/decision question.
        3. Points: Exactly 3 noun phrases.
        4. Opinions: Exactly 3 mixed opinions corresponding to points.
        5. Instructions: Standard C1 essay instruction.
        Keep it realistic.`;
        schemaProperties.opinions = { type: Type.ARRAY, items: { type: Type.STRING } };
        requiredFields.push("opinions");
      } else if (taskType === 'Report') {
        prompt = `Generate a Cambridge C1 Advanced (CAE) Writing Part 2 Report task about: "${randomTopic}".
        Structure:
        1. Context: Professional/academic situation defining role and reader.
        2. Question: Instruction on who to write to.
        3. Points: 2-3 specific content requirements.
        4. Instructions: "Write your report."
        Tone: Formal.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: schemaProperties,
            required: requiredFields
          }
        }
      });

      const jsonText = response.text;
      if (jsonText) {
        const baseTask = JSON.parse(jsonText);
        const newTask: GeneratedTask = {
          ...baseTask,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: taskType
        };
        
        setGeneratedTask(newTask);
        
        setTaskHistory(prev => {
          const updated = [newTask, ...prev];
          return updated.slice(0, 5);
        });
        
        setStudentText(''); 
      }
    } catch (error) {
      console.error("Failed to generate task:", error);
      alert("Failed to generate task. Please check API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadTaskFromHistory = (task: GeneratedTask) => {
    if (studentText.length > 20 && !window.confirm("Loading a previous task will overwrite your current text. Continue?")) {
      return;
    }
    setTaskType(task.type);
    setGeneratedTask(task);
    setStudentText(''); 
    setFeedback(null);
    setScores({ content: 0, communicative: 0, organisation: 0, language: 0 });
  };

  const handleDeleteTaskHistory = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this task from history?")) {
      setTaskHistory(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleDeleteAssessmentHistory = (entryId: number) => {
    if (window.confirm("Are you sure you want to delete this assessment?")) {
      setHistory(prev => prev.filter(h => h.id !== entryId));
    }
  };

  const handleImproveWriting = async () => {
    if (!studentText.trim()) { alert("Please enter text."); return; }
    setIsImproving(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const taskContext = generatedTask ? JSON.stringify(generatedTask) : `Generic ${taskType}`;
      
      const prompt = `Act as a Cambridge English Editor. Rewrite this C1 Advanced student text to Band 5 standard.
      
      Rules: 
      1. RETAIN arguments/intent. 
      2. Upgrade vocab/grammar. 
      3. Enhance cohesion. 
      4. FIX all errors.
      
      Context: ${taskContext}
      Student Text: "${studentText}"
      
      Output JSON: { 
        "rewrittenText": "The full polished text...", 
        "keyChanges": [
           "List specific GRAMMAR/SPELLING ERRORS fixed (Format: 'Correction: [original] -> [fixed]')",
           "List specific VOCABULARY UPGRADES (Format: 'Upgrade: [original] -> [advanced]')",
           "List Structural Improvements"
        ] 
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { 
          responseMimeType: 'application/json', 
          responseSchema: { 
            type: Type.OBJECT, 
            properties: { 
              rewrittenText: { type: Type.STRING }, 
              keyChanges: { type: Type.ARRAY, items: { type: Type.STRING } } 
            },
            required: ["rewrittenText", "keyChanges"]
          } 
        }
      });

      const result = JSON.parse(response.text);
      if (result) { setImprovedResponse(result); setActiveTab('improved'); }
    } catch (e) { console.error(e); alert("Improvement failed."); }
    finally { setIsImproving(false); }
  };

  const handleAssessWriting = async () => {
    if (!studentText.trim()) { alert("Please enter text."); return; }
    setIsAssessing(true);
    setIsScoreCollapsed(false); 
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const taskContext = generatedTask ? JSON.stringify(generatedTask) : `Generic ${taskType}`;
      const prompt = `Act as a Cambridge Examiner (CAE). Assess this text.
      Task: ${taskContext}
      Text: "${studentText}"
      Rubric: Content, Communicative Achievement, Organisation, Language.
      Output JSON: { scores: {content, communicative, organisation, language}, feedback: {content: {summary, strengths, weaknesses}, ... for all 4, plus general string} }`;

      const detailSchema = { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["summary", "strengths", "weaknesses"] };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scores: { type: Type.OBJECT, properties: { content: { type: Type.INTEGER }, communicative: { type: Type.INTEGER }, organisation: { type: Type.INTEGER }, language: { type: Type.INTEGER } } },
              feedback: { type: Type.OBJECT, properties: { content: detailSchema, communicative: detailSchema, organisation: detailSchema, language: detailSchema, general: { type: Type.STRING } } }
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      if (result) {
        setScores(result.scores);
        setFeedback(result.feedback);
        setHistory(prev => {
          const entry: HistoryEntry = { id: Date.now(), timestamp: new Date(), taskType, generatedTask, studentText, scores: result.scores, feedback: result.feedback, wordCount };
          return [entry, ...prev].slice(0, 3);
        });
      }
    } catch (e) { console.error(e); alert("Assessment failed."); }
    finally { setIsAssessing(false); }
  };

  const currentTaskInfo = TASK_TYPES.find(t => t.id === taskType);
  const canGenerate = taskType === 'Essay' || taskType === 'Report';

  return (
    <div className={`min-h-screen font-sans text-slate-800 relative ${isChristmas ? 'bg-slate-100' : 'bg-slate-100'}`}>
      
      {/* Christmas Snowflakes Layer */}
      {isChristmas && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="snowflake absolute text-opacity-40"
              style={{
                left: `${Math.random() * 100}vw`,
                animationDuration: `${Math.random() * 5 + 5}s`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: `${Math.random() * 20 + 10}px`,
              }}
            >
              ❄
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className={`border-b border-slate-200 sticky top-0 z-30 shadow-sm transition-colors duration-500 ${isChristmas ? 'bg-gradient-to-r from-red-900 via-green-900 to-red-900 text-white' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isChristmas ? 'bg-white/20' : 'bg-teal-600'}`}>
              <BookOpen className={`h-6 w-6 ${isChristmas ? 'text-white' : 'text-white'}`} />
            </div>
            <div>
              <h1 className={`text-xl font-bold leading-tight ${isChristmas ? 'text-white' : 'text-slate-900'}`}>
                {isChristmas ? '🎄 C1 Advanced Assessor 🎅' : 'C1 Advanced'}
              </h1>
              <p className={`text-xs font-medium tracking-wide ${isChristmas ? 'text-white/80' : 'text-slate-500'}`}>
                {isChristmas ? 'MERRY WRITING & HAPPY NEW YEAR!' : 'WRITING ASSESSMENT TOOL'}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <div className={`flex items-center ${isChristmas ? 'text-white/90' : 'text-slate-600'}`}>
              <span className="font-semibold mr-1">Time:</span> 1 hour 30 mins (Exam total)
            </div>
            <div className={`flex items-center ${isChristmas ? 'text-white/90' : 'text-slate-600'}`}>
              <span className="font-semibold mr-1">Target:</span> Level C1 (CEFR)
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            <ExamTimer />

            {/* Task Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center"><PenTool className={`w-5 h-5 mr-2 ${isChristmas ? 'text-red-600' : 'text-teal-600'}`} />Task Configuration</h2>
                <div className="flex items-center space-x-1 text-sm bg-orange-50 text-orange-800 px-3 py-1 rounded-full border border-orange-100"><AlertCircle className="w-4 h-4" /><span>Word Limit: 220–260</span></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Task Type</label>
                  <select value={taskType} onChange={(e) => handleTaskTypeChange(e.target.value as TaskType)} className={`w-full rounded-lg border-slate-300 shadow-sm focus:ring-opacity-50 bg-slate-50 py-2.5 ${isChristmas ? 'focus:border-red-500 focus:ring-red-500' : 'focus:border-teal-500 focus:ring-teal-500'}`}>
                    {TASK_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                  </select>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm flex items-center text-slate-600">{currentTaskInfo?.description}</div>
              </div>

              {canGenerate && (
                <button 
                  onClick={handleGenerateTask} 
                  disabled={isGenerating || isAssessing || isImproving} 
                  className={`w-full mt-2 flex items-center justify-center space-x-2 text-white py-2.5 rounded-lg transition-all shadow-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed ${
                    isChristmas 
                      ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600' 
                      : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600'
                  }`}
                >
                  {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Generating Task...</span></> : <><Sparkles className="w-4 h-4" /><span>Generate New {taskType === 'Essay' ? 'Part 1 Essay' : 'Part 2 Report'} Task {isChristmas && '🎁'}</span></>}
                </button>
              )}

              {/* Task Library (History) */}
              {taskHistory.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    <HistoryIcon className="w-3 h-3 mr-1" /> Recent Generated Tasks
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {taskHistory.map((task) => (
                      <div key={task.id} className="flex gap-2 group">
                        <button
                          onClick={() => handleLoadTaskFromHistory(task)}
                          className={`flex-1 text-left p-3 rounded-lg text-sm border transition-all flex items-center justify-between ${generatedTask?.id === task.id ? (isChristmas ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : 'bg-teal-50 border-teal-200 ring-1 ring-teal-200') : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                        >
                           <div className="truncate pr-2">
                             <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 uppercase tracking-wide ${task.type === 'Essay' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                               {task.type}
                             </span>
                             <span className="text-slate-700 font-medium">{task.context.substring(0, 50)}...</span>
                           </div>
                           {generatedTask?.id !== task.id && (
                             <RefreshCw className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                           )}
                        </button>
                        <button
                          onClick={(e) => handleDeleteTaskHistory(e, task.id)}
                          className="p-3 rounded-lg border border-slate-100 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-400 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generated Task View */}
            {generatedTask && (
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">{generatedTask.type === 'Essay' ? 'Part 1 - Essay Task' : 'Part 2 - Report Task'}</h3>
                  <span className="text-xs text-slate-400 font-mono">ID: {generatedTask.id.substring(0,6)}</span>
                </div>
                {generatedTask.type === 'Essay' ? (
                  <div className="p-6 text-slate-800 space-y-4">
                    <p className="font-serif leading-relaxed">{generatedTask.context}</p>
                    <div className={`bg-white border-2 rounded-lg p-6 my-4 shadow-sm ${isChristmas ? 'border-red-100' : 'border-slate-200'}`}>
                      <h4 className="font-bold mb-4 text-center">{generatedTask.question}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><ul className="list-disc list-inside space-y-2 font-medium">{generatedTask.points?.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
                        <div className="bg-slate-50 p-4 rounded border border-slate-100 text-sm"><p className="font-semibold text-slate-500 mb-2 text-xs uppercase tracking-wider">Opinions:</p><ul className="space-y-2 italic text-slate-600">{generatedTask.opinions?.map((op, i) => <li key={i}>"{op}"</li>)}</ul></div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-600 border-t border-slate-100 pt-4">{generatedTask.instructions}</p>
                  </div>
                ) : (
                  <div className="p-6 text-slate-800 space-y-4">
                    <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 mb-4"><h4 className="font-semibold text-slate-700 mb-2 uppercase text-xs tracking-wider">Context</h4><p className="font-serif leading-relaxed text-slate-800">{generatedTask.context}</p></div>
                    <div className="space-y-4"><p className="font-medium text-lg">{generatedTask.question}</p><div className={`bg-white border-l-4 pl-4 py-2 my-4 ${isChristmas ? 'border-red-500' : 'border-teal-500'}`}><p className="text-sm text-slate-500 mb-2 font-semibold uppercase">In your report you should:</p><ul className="list-disc list-inside space-y-2 text-slate-800 font-medium">{generatedTask.points?.map((p, i) => <li key={i}>{p}</li>)}</ul></div></div>
                    <p className="text-sm font-bold text-slate-600 border-t border-slate-100 pt-4 mt-6">{generatedTask.instructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Student Writing Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[650px] overflow-hidden">
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button onClick={() => setActiveTab('draft')} className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center transition-colors ${activeTab === 'draft' ? (isChristmas ? 'bg-white text-red-700 border-t-2 border-red-600' : 'bg-white text-teal-700 border-t-2 border-teal-600') : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}><PenTool className="w-4 h-4 mr-2" />My Draft</button>
                <button onClick={() => improvedResponse ? setActiveTab('improved') : null} disabled={!improvedResponse} className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center transition-colors ${activeTab === 'improved' ? (isChristmas ? 'bg-white text-green-700 border-t-2 border-green-600' : 'bg-white text-indigo-700 border-t-2 border-indigo-600') : improvedResponse ? (isChristmas ? 'text-slate-500 hover:text-green-600 hover:bg-green-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50') : 'text-slate-300 cursor-not-allowed'}`}><Wand2 className="w-4 h-4 mr-2" />C1 Polished Version</button>
              </div>
              <div className="px-4 py-2 bg-white border-b border-slate-100 flex justify-between items-center text-xs">
                 <span className="text-slate-500 font-medium uppercase tracking-wide">{activeTab === 'draft' ? 'Editing Mode' : 'Review Mode'}</span>
                 <span className={`transition-colors duration-300 ${getWordCountColor()}`}>{wordCount} words</span>
              </div>
              <div className="flex-1 relative">
                {activeTab === 'draft' ? (
                  <textarea className="w-full h-full p-6 focus:ring-0 border-none resize-none font-serif text-lg leading-relaxed text-slate-800 placeholder:text-slate-300 focus:outline-none" placeholder="Paste or type the student's work here..." value={studentText} onChange={(e) => setStudentText(e.target.value)} />
                ) : (
                  <div className={`w-full h-full p-6 overflow-y-auto ${isChristmas ? 'bg-green-50/30' : 'bg-indigo-50/30'}`}>
                     <div className="font-serif text-lg leading-relaxed text-slate-800 whitespace-pre-wrap">{improvedResponse?.rewrittenText}</div>
                     {improvedResponse && (<div className={`mt-8 p-4 rounded-lg border ${isChristmas ? 'bg-green-50 border-green-100' : 'bg-indigo-50 border-indigo-100'}`}><h4 className={`text-sm font-bold mb-2 flex items-center ${isChristmas ? 'text-green-800' : 'text-indigo-800'}`}><Sparkles className="w-4 h-4 mr-2" />Key Improvements Made</h4><ul className="space-y-1">{improvedResponse.keyChanges.map((change, i) => <li key={i} className={`text-sm flex items-start ${isChristmas ? 'text-green-700' : 'text-indigo-700'}`}><span className="mr-2">•</span> {change}</li>)}</ul></div>)}
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                <button 
                  onClick={handleImproveWriting} 
                  disabled={isImproving || isAssessing || !studentText.trim()} 
                  className={`flex items-center space-x-2 bg-white border px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    isChristmas 
                      ? 'text-green-700 border-green-200 hover:bg-green-50 hover:border-green-300' 
                      : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'
                  }`}
                >
                  {isImproving ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Polishing...</span></> : <><Wand2 className="w-5 h-5" /><span>Rewrite to C1 Standard</span></>}
                </button>
                <button 
                  onClick={handleAssessWriting} 
                  disabled={isAssessing || isImproving || !studentText.trim()} 
                  className={`flex items-center space-x-2 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    isChristmas 
                      ? 'bg-green-700 hover:bg-green-800' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isAssessing ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Assessing...</span></> : <><Send className="w-5 h-5" /><span>Assess Writing</span></>}
                </button>
              </div>
            </div>
            
            <div className="bg-teal-900 text-teal-100 rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-white mb-4 flex items-center"><InfoTooltip content="Definitions from the Cambridge Teacher Guide" />Key Terminology</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div><span className="block font-bold text-white mb-1">Target Reader</span><p className="opacity-90">The intended audience. Does the tone and content suit them?</p></div>
                <div><span className="block font-bold text-white mb-1">Slips vs. Errors</span><p className="opacity-90"><span className="text-teal-300 font-semibold">Slip:</span> Accidental mistake. <span className="text-teal-300 font-semibold">Error:</span> Lack of knowledge.</p></div>
                <div><span className="block font-bold text-white mb-1">Complex Ideas</span><p className="opacity-90">Abstract thoughts requiring rhetorical resources.</p></div>
                <div><span className="block font-bold text-white mb-1">Conventions</span><p className="opacity-90">Genre-specific rules (e.g., headings for reports).</p></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <HistoryList history={history} onDelete={handleDeleteAssessmentHistory} />
            <div className={`bg-white rounded-xl shadow-lg border border-slate-200 sticky top-24 z-20 transition-all duration-300 ${isScoreCollapsed ? 'p-4' : 'p-6'}`}>
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <button onClick={() => setIsScoreCollapsed(!isScoreCollapsed)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors" title={isScoreCollapsed ? "Expand" : "Collapse"}>{isScoreCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}</button>
                   <div><h2 className={`${isScoreCollapsed ? 'text-lg' : 'text-2xl'} font-bold text-slate-900 transition-all`}>Total Score</h2>{!isScoreCollapsed && <p className="text-sm text-slate-500">Cambridge Scale</p>}</div>
                 </div>
                 <div className="text-right flex items-baseline gap-1"><span className={`${isScoreCollapsed ? 'text-3xl' : 'text-5xl'} font-extrabold text-teal-600 tracking-tight transition-all`}>{totalScore}</span><span className="text-slate-400 font-medium">/20</span></div>
               </div>
               {!isScoreCollapsed && (
                 <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                   <div className="h-64 w-full -ml-4"><ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}><PolarGrid gridType="polygon" stroke="#e2e8f0" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} /><PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} /><Radar name="Student" dataKey="A" stroke="#0d9488" strokeWidth={3} fill="#14b8a6" fillOpacity={0.3} /></RadarChart></ResponsiveContainer></div>
                   {feedback && (<div className="mt-6 border-t border-slate-100 pt-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Examiner's Summary</p><p className="text-sm text-slate-700 italic">"{feedback.general}"</p></div>)}
                   {totalScore >= 12 ? (<div className="mt-4 flex items-center justify-center p-3 bg-green-50 text-green-800 rounded-lg text-sm font-medium"><CheckCircle2 className="w-5 h-5 mr-2" />On track for C1 Advanced Pass</div>) : (<div className="mt-4 flex items-center justify-center p-3 bg-orange-50 text-orange-800 rounded-lg text-sm font-medium"><AlertCircle className="w-5 h-5 mr-2" />Needs improvement for C1 Level</div>)}
                 </div>
               )}
            </div>
            <div className="space-y-6">
              <AssessmentCard scale={SCALES[0]} value={scores.content} onChange={(v) => setScores(s => ({ ...s, content: v }))} aiFeedback={feedback?.content} />
              <AssessmentCard scale={SCALES[1]} value={scores.communicative} onChange={(v) => setScores(s => ({ ...s, communicative: v }))} aiFeedback={feedback?.communicative} />
              <AssessmentCard scale={SCALES[2]} value={scores.organisation} onChange={(v) => setScores(s => ({ ...s, organisation: v }))} aiFeedback={feedback?.organisation} />
              <AssessmentCard scale={SCALES[3]} value={scores.language} onChange={(v) => setScores(s => ({ ...s, language: v }))} aiFeedback={feedback?.language} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;