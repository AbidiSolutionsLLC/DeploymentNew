const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/Components/home/TodoCard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add ModernDatePicker import
content = content.replace(
  'import EmptyCardState from "./EmptyCardState";',
  'import EmptyCardState from "./EmptyCardState";\nimport ModernDatePicker from "../ui/ModernDatePicker";'
);

// Change "Add Todo" to "Add To-Do" in the heading
content = content.replace(
  'Add Todo\n                </h3>',
  'Add To-Do\n                </h3>'
);

// Replace the Add Modal date input with ModernDatePicker
const addModalDateReplacement = `                <div>
                  <ModernDatePicker
                    label="Due Date"
                    name="dueDate"
                    value={addModalForm.dueDate}
                    onChange={(e) => handleAddFieldChange("dueDate", e.target.value)}
                    required
                    placeholder="Select Date"
                    error={addModalTouched.dueDate && addErrors.dueDate ? addErrors.dueDate : null}
                  />
                </div>`;

content = content.replace(
  /                <div>\s*<label className="block text-\[10px\] font-bold text-slate-500 uppercase tracking-wide mb-1\.5">\s*Due date\s*<\/label>\s*<input\s*type="date"\s*min=\{getToday\(\)\}\s*className=\{`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 bg-white \$\{\s*addModalTouched\.dueDate && addErrors\.dueDate \? "border-red-400" : "border-slate-200"\s*\}`\}\s*value=\{addModalForm\.dueDate\}\s*onChange=\{\(e\) => handleAddFieldChange\("dueDate", e\.target\.value\)\}\s*onBlur=\{\(\) => handleAddFieldBlur\("dueDate"\)\}\s*\/>\s*\{addModalTouched\.dueDate && addErrors\.dueDate && \(\s*<p className="text-\[11px\] text-red-500 mt-1\.5">\{addErrors\.dueDate\}<\/p>\s*\)\}\s*<\/div>/,
  addModalDateReplacement
);

// Replace the Detail Modal date input with ModernDatePicker
const detailModalDateReplacement = `                  <div>
                    <ModernDatePicker
                      label="Due Date"
                      name="dueDate"
                      value={modalForm.dueDate}
                      onChange={(e) => handleModalFieldChange("dueDate", e.target.value)}
                      required
                      placeholder="Select Date"
                      error={modalTouched.dueDate && modalErrors.dueDate ? modalErrors.dueDate : null}
                    />
                  </div>`;

content = content.replace(
  /                  <div>\s*<label className="block text-\[10px\] font-bold text-slate-500 uppercase tracking-wide mb-1\.5">\s*Due date\s*<\/label>\s*<input\s*type="date"\s*className=\{`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 bg-white \$\{\s*modalTouched\.dueDate && modalErrors\.dueDate \? "border-red-400" : "border-slate-200"\s*\}`\}\s*value=\{modalForm\.dueDate\}\s*onChange=\{\(e\) => handleModalFieldChange\("dueDate", e\.target\.value\)\}\s*onBlur=\{\(\) => handleModalFieldBlur\("dueDate"\)\}\s*\/>\s*\{modalTouched\.dueDate && modalErrors\.dueDate && \(\s*<p className="text-\[11px\] text-red-500 mt-1\.5">\{modalErrors\.dueDate\}<\/p>\s*\)\}\s*<\/div>/,
  detailModalDateReplacement
);

fs.writeFileSync(filePath, content);
console.log('TodoCard.jsx updated successfully!');
