import os
import glob

files = glob.glob('frontend/src/**/*Modal.jsx', recursive=True)

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'border-border-subtle' in content:
        new_content = content.replace('border-border-subtle', 'border-slate-200').replace('bg-surface/50', 'bg-slate-50')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {path}")
