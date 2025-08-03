import os
from werkzeug.utils import secure_filename

def save_files(files, upload_folder, prefix=''):
    paths = []
    for i, file in enumerate(files):
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            filepath = os.path.join(upload_folder, f'{prefix}_{i+1}_{filename}')
            file.save(filepath)
            paths.append(filepath)
    return paths

def save_file(file, upload_folder, prefix=''):
    filename = secure_filename(file.filename)
    filepath = os.path.join(upload_folder, f'{prefix}_{filename}')
    file.save(filepath)
    return os.path.basename(filepath)