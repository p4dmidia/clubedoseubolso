import glob
import os
import zipfile
import xml.etree.ElementTree as ET

def get_docx_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            text_list = []
            for para in root.findall('.//w:p', ns):
                text_runs = []
                for run in para.findall('.//w:t', ns):
                    if run.text:
                        text_runs.append(run.text)
                if text_runs:
                    text_list.append("".join(text_runs))
            return "\n".join(text_list)
    except Exception as e:
        return f"Error: {e}"

files = glob.glob(r"c:\Users\eu\Downloads\*afiliados.docx")
if files:
    content = get_docx_text(files[0])
    with open("scratch/affiliates_docx_content.txt", "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully wrote content to scratch/affiliates_docx_content.txt")
else:
    print("No files found matching *afiliados.docx")
