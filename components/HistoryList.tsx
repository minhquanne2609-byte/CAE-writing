import React from 'react';
import { HistoryEntry } from '../types';
import { Download, History, FileText, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';

interface HistoryListProps {
  history: HistoryEntry[];
  onDelete?: (id: number) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onDelete }) => {
  if (history.length === 0) return null;

  const downloadDoc = async (entry: HistoryEntry) => {
    try {
      // Helper for bold labels
      const createLabel = (text: string) => new TextRun({ text, bold: true, size: 24 });
      const createValue = (text: string) => new TextRun({ text: ` ${text}`, size: 24 });
      
      const scoreRows = [
        ['Content', entry.scores.content],
        ['Communicative Achievement', entry.scores.communicative],
        ['Organisation', entry.scores.organisation],
        ['Language', entry.scores.language],
      ].map(([scale, score]) => (
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: scale as string })] }),
            new TableCell({ children: [new Paragraph({ text: score.toString(), alignment: AlignmentType.CENTER })] }),
          ],
        })
      ));

      // Construct Task Description
      let taskParagraphs = [];
      if (entry.generatedTask) {
        taskParagraphs.push(new Paragraph({ children: [createLabel("Context: "), createValue(entry.generatedTask.context)], spacing: { after: 200 } }));
        taskParagraphs.push(new Paragraph({ children: [createLabel("Question: "), createValue(entry.generatedTask.question)], spacing: { after: 200 } }));
        
        entry.generatedTask.points.forEach(point => {
          taskParagraphs.push(new Paragraph({ text: `• ${point}`, bullet: { level: 0 } }));
        });
        
        if (entry.generatedTask.opinions) {
           taskParagraphs.push(new Paragraph({ text: "Opinions:", spacing: { before: 200 } }));
           entry.generatedTask.opinions.forEach(op => {
             taskParagraphs.push(new Paragraph({ text: `"${op}"`, bullet: { level: 0 } }));
           });
        }
      } else {
        taskParagraphs.push(new Paragraph({ text: "Custom Task / No Prompt Provided" }));
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Header
            new Paragraph({
              text: "Cambridge C1 Advanced Writing Assessment",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Metadata
            new Paragraph({
              children: [
                createLabel("Date: "), createValue(entry.timestamp.toLocaleString()),
                new TextRun({ text: "\t" }),
                createLabel("Task Type: "), createValue(entry.taskType),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                createLabel("Word Count: "), createValue(entry.wordCount.toString()),
                new TextRun({ text: "\t" }),
                createLabel("Total Score: "), createValue(`${entry.scores.content + entry.scores.communicative + entry.scores.organisation + entry.scores.language}/20`),
              ],
              spacing: { after: 400 },
            }),

            // Task Section
            new Paragraph({ text: "Task Requirements", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
            ...taskParagraphs,
            
            // Student Text
            new Paragraph({ text: "Student Submission", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
            new Paragraph({ text: entry.studentText, spacing: { after: 400 } }),

            // Assessment Score Table
            new Paragraph({ text: "Assessment Scores", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Subscale", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Band (0-5)", bold: true })] }),
                  ],
                }),
                ...scoreRows
              ],
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),

            // Feedback Section
            new Paragraph({ text: "Examiner Feedback", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
            
            new Paragraph({ children: [createLabel("General Summary: ")] }),
            new Paragraph({ text: entry.feedback.general, spacing: { after: 300 } }),

            // Detailed Feedback
            ...Object.entries({
              Content: entry.feedback.content,
              "Communicative Achievement": entry.feedback.communicative,
              Organisation: entry.feedback.organisation,
              Language: entry.feedback.language
            }).flatMap(([name, detail]) => [
               new Paragraph({ text: name, heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
               new Paragraph({ text: detail.summary, spacing: { after: 100 } }),
               new Paragraph({ text: "Strengths:", bold: true }),
               ...detail.strengths.map(s => new Paragraph({ text: `• ${s}`, bullet: { level: 0 } })),
               new Paragraph({ text: "Improvements:", bold: true, spacing: { before: 100 } }),
               ...detail.weaknesses.map(w => new Paragraph({ text: `• ${w}`, bullet: { level: 0 } })),
            ])
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      
      // Simple download trigger
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `C1_Assessment_${entry.taskType}_${entry.timestamp.toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error generating document:", error);
      alert("Could not generate the document. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <History className="w-5 h-5 text-slate-500" />
        <h3 className="font-bold text-slate-800">Recent History (Last 3)</h3>
      </div>
      
      <div className="space-y-3">
        {history.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
            <div className="flex items-center space-x-3">
               <div className="bg-white p-2 rounded shadow-sm">
                 <FileText className="w-5 h-5 text-teal-600" />
               </div>
               <div>
                 <p className="font-semibold text-sm text-slate-800">{entry.taskType} Task</p>
                 <div className="flex items-center space-x-2 text-xs text-slate-500">
                   <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {entry.timestamp.toLocaleDateString()}</span>
                   <span>•</span>
                   <span>{entry.wordCount} words</span>
                   <span>•</span>
                   <span className="font-bold text-teal-700">Score: {entry.scores.content + entry.scores.communicative + entry.scores.organisation + entry.scores.language}/20</span>
                 </div>
               </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => downloadDoc(entry)}
                className="flex items-center space-x-1 text-xs font-medium bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-teal-600 transition-colors shadow-sm"
                title="Download Word Document"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                  title="Delete Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};