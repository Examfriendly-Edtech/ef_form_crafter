import React from 'react';
import {
  Type,
  AlignLeft,
  List,
  CheckSquare,
  CircleDot,
  Calendar,
  UploadCloud,
  Star,
  Grid,
  Users,
} from 'lucide-react';
import { FieldType } from '../../types';

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

interface PaletteItem {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
  category: 'standard' | 'interactive' | 'course';
  description: string;
}

export const FieldPalette: React.FC<FieldPaletteProps> = ({ onAddField }) => {
  const paletteItems: PaletteItem[] = [
    {
      type: 'course_slot',
      label: 'Course Slot & Capacity',
      icon: <Users className="w-4 h-4 text-emerald-700" />,
      category: 'course',
      description: 'Slot inventory caps & live booking counts',
    },
    {
      type: 'matrix',
      label: 'Likert Scale Grid',
      icon: <Grid className="w-4 h-4 text-purple-700" />,
      category: 'interactive',
      description: 'Multi-row satisfaction evaluation matrix',
    },
    {
      type: 'rating',
      label: 'Star / Numeric Rating',
      icon: <Star className="w-4 h-4 text-amber-500" />,
      category: 'interactive',
      description: '1 to 5 or 1 to 10 scale rating score',
    },
    {
      type: 'file',
      label: 'File Upload',
      icon: <UploadCloud className="w-4 h-4 text-blue-600" />,
      category: 'interactive',
      description: 'Upload resumes, PDF portfolios, or images',
    },
    {
      type: 'datetime',
      label: 'Date & Time',
      icon: <Calendar className="w-4 h-4 text-amber-600" />,
      category: 'interactive',
      description: 'Appointment slot or calendar date picker',
    },
    {
      type: 'text',
      label: 'Short Text',
      icon: <Type className="w-4 h-4 text-slate-700" />,
      category: 'standard',
      description: 'Single-line input for names and titles',
    },
    {
      type: 'textarea',
      label: 'Long Text',
      icon: <AlignLeft className="w-4 h-4 text-slate-700" />,
      category: 'standard',
      description: 'Multi-line feedback, essays or notes',
    },
    {
      type: 'select',
      label: 'Dropdown Select',
      icon: <List className="w-4 h-4 text-slate-700" />,
      category: 'standard',
      description: 'Compact single-choice list menu',
    },
    {
      type: 'radio',
      label: 'Radio Choices',
      icon: <CircleDot className="w-4 h-4 text-slate-700" />,
      category: 'standard',
      description: 'Exclusively single selectable choice',
    },
    {
      type: 'checkbox',
      label: 'Checkboxes',
      icon: <CheckSquare className="w-4 h-4 text-slate-700" />,
      category: 'standard',
      description: 'Multi-selection checklist group',
    },
  ];

  return (
    <aside className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs sticky top-24 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Form Components</h3>
        <p className="text-xs text-slate-500 mt-0.5">Click to append to active section</p>
      </div>

      <div className="space-y-4">
        {/* Course Specific */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Course & Registration
          </span>
          <div className="space-y-1.5">
            {paletteItems
              .filter((i) => i.category === 'course')
              .map((item) => (
                <button
                  key={item.type}
                  onClick={() => onAddField(item.type)}
                  className="w-full text-left p-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 transition-all flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1 rounded-lg bg-white border border-emerald-100 shadow-xs shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 group-hover:text-emerald-800">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-emerald-700/90 leading-tight mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Survey & Interactive */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Survey & Evaluation
          </span>
          <div className="space-y-1.5">
            {paletteItems
              .filter((i) => i.category === 'interactive')
              .map((item) => (
                <button
                  key={item.type}
                  onClick={() => onAddField(item.type)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1 rounded-lg bg-white border border-slate-200/60 shadow-xs shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Standard Inputs */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Standard Inputs
          </span>
          <div className="space-y-1.5">
            {paletteItems
              .filter((i) => i.category === 'standard')
              .map((item) => (
                <button
                  key={item.type}
                  onClick={() => onAddField(item.type)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1 rounded-lg bg-white border border-slate-200/60 shadow-xs shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
