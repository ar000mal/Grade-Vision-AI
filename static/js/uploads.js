document.addEventListener('DOMContentLoaded', () => {
    const questionPapersDropZone = document.getElementById('questionPapersDropZone');
    const answerSheetsDropZone = document.getElementById('answerSheetsDropZone');
    const questionPapersPreview = document.getElementById('questionPapersPreview');
    const answerSheetsPreview = document.getElementById('answerSheetsPreview');
    const questionPapersInput = document.getElementById('questionPapers');
    const answerSheetsInput = document.getElementById('answerSheets');
    const questionPapersCount = document.getElementById('questionPapersCount');
    const answerSheetsCount = document.getElementById('answerSheetsCount');
    const uploadForm = document.getElementById('uploadForm');
    const deleteArea = document.getElementById('deleteArea');
    const imageModal = document.getElementById('imageModal');
    const fullSizeImage = document.getElementById('fullSizeImage');
    const closeModal = document.querySelector('.close-modal');
    const referencesDropZone = document.getElementById('referencesDropZone');
    const referencesPreview = document.getElementById('referencesPreview');
    const referencesInput = document.getElementById('references');
    const referencesCount = document.getElementById('referencesCount');

    let questionPapersFiles = [];
    let answerSheetsFiles = [];
    let questionOrder = [];
    let answerOrder = [];
    let referencesFiles = [];
    let referencesOrder = [];

    function updateImageCount(dropZoneId) {
        if (dropZoneId === 'referencesDropZone') {
            const countElement = document.getElementById('referencesCount');
            countElement.textContent = `Files: ${referencesOrder.length}`;
        } else {
            const orderArray = dropZoneId === 'questionPapersDropZone' ? questionOrder : answerOrder;
            const countElement = document.getElementById(dropZoneId === 'questionPapersDropZone' ? 'questionPapersCount' : 'answerSheetsCount');
            countElement.textContent = `Images: ${orderArray.length}`;
        }
    }

    function displayImagePreview(file, previewContainer, dropZoneId, actualFileIndex) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const imgContainer = document.createElement('div');
            imgContainer.classList.add('preview-image-container');
            imgContainer.setAttribute('data-file-index', actualFileIndex);
            imgContainer.style.animation = 'slideIn 0.3s ease';

            const isImageFile = file.type.startsWith('image/');
            let displayElement;

            if (isImageFile) {
                displayElement = document.createElement('img');
                displayElement.classList.add('preview-image');
                displayElement.src = e.target.result;

                displayElement.addEventListener('click', (event) => {
                    event.stopPropagation();
                    fullSizeImage.src = displayElement.src;
                    imageModal.style.display = 'block';
                });
            } else {
                displayElement = document.createElement('div');
                displayElement.classList.add('file-icon');
                displayElement.textContent = file.name;
            }

            imgContainer.appendChild(displayElement);
            previewContainer.appendChild(imgContainer);

            makeDraggable(imgContainer, dropZoneId);
        };

        reader.readAsDataURL(file);
    }

    function addNewFiles(files, dropZoneId) {
        const previewContainer = document.getElementById(dropZoneId === 'questionPapersDropZone' ? 'questionPapersPreview' : dropZoneId === 'answerSheetsDropZone' ? 'answerSheetsPreview' : 'referencesPreview');
        const fileArray = dropZoneId === 'questionPapersDropZone' ? questionPapersFiles : dropZoneId === 'answerSheetsDropZone' ? answerSheetsFiles : referencesFiles;
        const orderArray = dropZoneId === 'questionPapersDropZone' ? questionOrder : dropZoneId === 'answerSheetsDropZone' ? answerOrder : referencesOrder;

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataURL = e.target.result;
                const isDuplicate = fileArray.some(existingFile => existingFile && existingFile.dataURL === dataURL);

                if (!isDuplicate) {
                    file.dataURL = dataURL;
                    const actualFileIndex = fileArray.length;
                    fileArray.push(file);
                    orderArray.push(actualFileIndex);
                    displayImagePreview(file, previewContainer, dropZoneId, actualFileIndex);
                }
            };
            reader.readAsDataURL(file);
        });

        updateImageCount(dropZoneId);
    }

    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        questionPapersDropZone.addEventListener(eventName, preventDefaults, false);
        answerSheetsDropZone.addEventListener(eventName, preventDefaults, false);
        referencesDropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ;['dragenter', 'dragover'].forEach((eventName) => {
        const highlightDropZone = (event) => highlight(event.target);
        questionPapersDropZone.addEventListener(eventName, highlightDropZone, false);
        answerSheetsDropZone.addEventListener(eventName, highlightDropZone, false);
        referencesDropZone.addEventListener(eventName, highlightDropZone, false);
    });

    ;['dragleave', 'drop'].forEach((eventName) => {
        const unhighlightDropZone = (event) => unhighlight(event.target);
        questionPapersDropZone.addEventListener(eventName, unhighlightDropZone, false);
        answerSheetsDropZone.addEventListener(eventName, unhighlightDropZone, false);
        referencesDropZone.addEventListener(eventName, unhighlightDropZone, false);
    });

    function highlight(dropZone) {
        if (dropZone.classList) {
            dropZone.classList.add('highlight');
        }
    }

    function unhighlight(dropZone) {
        if (dropZone.classList) {
            dropZone.classList.remove('highlight');
        }
    }

    questionPapersDropZone.addEventListener('drop', handleDrop, false);
    answerSheetsDropZone.addEventListener('drop', handleDrop, false);
    referencesDropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const files = e.dataTransfer.files;
        const dropZoneId = e.target.closest('.drop-zone')?.id;
        if (files && files.length > 0 && dropZoneId) {
            addNewFiles(files, dropZoneId);
        }
    }

    questionPapersInput.addEventListener('change', handleFileSelect, false);
    answerSheetsInput.addEventListener('change', handleFileSelect, false);
    referencesInput.addEventListener('change', handleFileSelect, false);

    function handleFileSelect(e) {
        const files = e.target.files;
        const dropZoneId = e.target.closest('.drop-zone').id;
        if (files && files.length > 0 && dropZoneId) {
            addNewFiles(files, dropZoneId);
        }
    }

    questionPapersDropZone.addEventListener('click', () => questionPapersInput.click());
    answerSheetsDropZone.addEventListener('click', () => answerSheetsInput.click());
    referencesDropZone.addEventListener('click', () => referencesInput.click());

    closeModal.addEventListener('click', () => {
        imageModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === imageModal) {
            imageModal.style.display = 'none';
        }
    });

    let draggedItem = null;
    let sourceDropZoneId = null;

    function makeDraggable(item, dropZoneId) {
        item.setAttribute('draggable', 'true');

        item.ondragstart = (e) => {
            draggedItem = item;
            sourceDropZoneId = dropZoneId;
            deleteArea.classList.add('active');
            item.classList.add('dragging');
            e.dataTransfer.setData('text', '');
        };

        item.ondrag = (e) => {
            if (e.clientX && e.clientY) {
                if (isInsideDeleteArea(e.clientX, e.clientY, deleteArea)) {
                    deleteArea.classList.add('dropping');
                } else {
                    deleteArea.classList.remove('dropping');
                }
            }
        };

        item.ondragend = () => {
            draggedItem = null;
            sourceDropZoneId = null;
            deleteArea.classList.remove('active', 'dropping');
            if (item.classList.contains('dragging')) {
                item.classList.remove('dragging');
            }
        };
    }

    function isInsideDeleteArea(mouseX, mouseY, deleteArea) {
        const deleteRect = deleteArea.getBoundingClientRect();
        return mouseX >= deleteRect.left &&
               mouseX <= deleteRect.right &&
               mouseY >= deleteRect.top &&
               mouseY <= deleteRect.bottom;
    }

    deleteArea.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    deleteArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        deleteArea.classList.add('dropping');
    });

    deleteArea.addEventListener('dragleave', () => {
        deleteArea.classList.remove('dropping');
    });

    deleteArea.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedItem) return;

        const previewContainer = draggedItem.parentElement;
        const dropZoneId = sourceDropZoneId;

        const fileArray = dropZoneId === 'questionPapersDropZone' ? questionPapersFiles : dropZoneId === 'answerSheetsDropZone' ? answerSheetsFiles : referencesFiles;
        const orderArray = dropZoneId === 'questionPapersDropZone' ? questionOrder : dropZoneId === 'answerSheetsDropZone' ? answerOrder : referencesOrder;

        const itemToRemove = draggedItem;
        const itemIndexInPreview = Array.from(previewContainer.children).indexOf(itemToRemove);

        if (itemIndexInPreview > -1) {
            itemToRemove.style.animation = 'fadeOut 0.3s ease';

            setTimeout(() => {
                orderArray.splice(itemIndexInPreview, 1);

                const newFileArray = [];
                const newOrderArray = [];

                orderArray.forEach((oldIndex, newIndex) => {
                    newFileArray.push(fileArray[oldIndex]);
                    newOrderArray.push(newIndex);
                });

                if (dropZoneId === 'questionPapersDropZone') {
                    questionPapersFiles = newFileArray;
                    questionOrder = newOrderArray;
                } else if (dropZoneId === 'answerSheetsDropZone') {
                    answerSheetsFiles = newFileArray;
                    answerOrder = newOrderArray;
                } else {
                    referencesFiles = newFileArray;
                    referencesOrder = newOrderArray;
                }

                renderImagePreviews(dropZoneId);
            }, 300);
        }

        deleteArea.classList.remove('dropping');
        draggedItem = null;
        sourceDropZoneId = null;
    });

    function renderImagePreviews(dropZoneId) {
        const previewContainer = document.getElementById(dropZoneId === 'questionPapersDropZone' ? 'questionPapersPreview' : dropZoneId === 'answerSheetsDropZone' ? 'answerSheetsPreview' : 'referencesPreview');
        const fileArray = dropZoneId === 'questionPapersDropZone' ? questionPapersFiles : dropZoneId === 'answerSheetsDropZone' ? answerSheetsFiles : referencesFiles;
        const orderArray = dropZoneId === 'questionPapersDropZone' ? questionOrder : dropZoneId === 'answerSheetsDropZone' ? answerOrder : referencesOrder;

        previewContainer.innerHTML = '';

        orderArray.forEach((fileIndex, displayIndex) => {
            if (fileArray[fileIndex]) {
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('preview-image-container');
                imgContainer.setAttribute('data-file-index', fileIndex);
                imgContainer.setAttribute('data-display-index', displayIndex);

                const isImageFile = fileArray[fileIndex].type.startsWith('image/');
                let displayElement;

                if (isImageFile) {
                    displayElement = document.createElement('img');
                    displayElement.classList.add('preview-image');
                    displayElement.src = fileArray[fileIndex].dataURL || URL.createObjectURL(fileArray[fileIndex]);

                    displayElement.addEventListener('click', (event) => {
                        event.stopPropagation()
                        fullSizeImage.src = displayElement.src;
                        imageModal.style.display = 'block';
                    });
                } else {
                    displayElement = document.createElement('div');
                    displayElement.classList.add('file-icon');
                    displayElement.textContent = fileArray[fileIndex].name;
                }

                imgContainer.appendChild(displayElement);
                previewContainer.appendChild(imgContainer);
                makeDraggable(imgContainer, dropZoneId);
            }
        });

        updateImageCount(dropZoneId);
    }

    document.querySelectorAll('.drop-zone').forEach((dropZone) => {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!draggedItem) return;

            const targetImageContainer = e.target.closest('.preview-image-container');

            if (targetImageContainer && targetImageContainer !== draggedItem) {
                const sourceFileIndex = parseInt(draggedItem.getAttribute('data-file-index'), 10);
                const targetFileIndex = parseInt(targetImageContainer.getAttribute('data-file-index'), 10);

                if (sourceDropZoneId === dropZone.id) {
                    const orderArray = sourceDropZoneId === 'questionPapersDropZone' ? questionOrder : sourceDropZoneId === 'answerSheetsDropZone' ? answerOrder : referencesOrder;
                    const sourceOrderIndex = orderArray.findIndex(index => index === sourceFileIndex);
                    const targetOrderIndex = orderArray.findIndex(index => index === targetFileIndex);

                    if (sourceOrderIndex > -1 && targetOrderIndex > -1) {
                        [orderArray[sourceOrderIndex], orderArray[targetOrderIndex]] = [orderArray[targetOrderIndex], orderArray[sourceOrderIndex]];
                        renderImagePreviews(sourceDropZoneId);
                    }
                }
            } else if (e.target === dropZone && !targetImageContainer) {
                const previewContainerElement = e.target.querySelector('.preview-container');
                if (previewContainerElement) {
                    const afterElement = getDragAfterElement(previewContainerElement, e.clientY);
                    const orderArray = sourceDropZoneId === 'questionPapersDropZone' ? questionOrder : sourceDropZoneId === 'answerSheetsDropZone' ? answerOrder : referencesOrder;
                    const sourceFileIndex = parseInt(draggedItem.getAttribute('data-file-index'), 10);
                    const currentOrderIndex = orderArray.findIndex(index => index === sourceFileIndex);

                    if (currentOrderIndex > -1) {
                        orderArray.splice(currentOrderIndex, 1);
                        let newIndex;
                        if (afterElement) {
                            const targetIndex = parseInt(afterElement.getAttribute('data-file-index'), 10);
                            const beforeElementIndex = orderArray.findIndex(index => index === targetIndex);
                            if (beforeElementIndex > -1) {
                                orderArray.splice(beforeElementIndex, 0, sourceFileIndex);
                            } else {
                                orderArray.push(sourceFileIndex);
                            }
                        } else {
                            orderArray.push(sourceFileIndex);
                        }
                        renderImagePreviews(sourceDropZoneId);
                    }
                }
            }
        });
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [
            ...container.querySelectorAll('.preview-image-container:not(.dragging)'),
        ];

        return draggableElements.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            },
            { offset: Number.NEGATIVE_INFINITY }
        ).element;
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();

        questionOrder.forEach((fileIndex) => {
            if (questionPapersFiles[fileIndex]) {
                formData.append('question_papers', questionPapersFiles[fileIndex]);
            }
        });

        answerOrder.forEach((fileIndex) => {
            if (answerSheetsFiles[fileIndex]) {
                formData.append('answer_sheets', answerSheetsFiles[fileIndex]);
            }
        });

        referencesOrder.forEach((fileIndex) => {
            if (referencesFiles[fileIndex]) {
                formData.append('references', referencesFiles[fileIndex]);
            }
        });

        const gradingDifficulty = document.getElementById('gradingDifficulty').value;
        formData.append('grading_difficulty', gradingDifficulty);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();

                const orderedQuestionPaths = questionOrder
                    .map((_, index) => data.question_paths[index])
                    .filter(path => path !== undefined);

                const orderedAnswerPaths = answerOrder
                    .map((_, index) => data.answer_paths[index])
                    .filter(path => path !== undefined);

                const questionPathParams = orderedQuestionPaths
                    .map(path => `question_paths=${encodeURIComponent(path)}`)
                    .join('&');

                const answerPathParams = orderedAnswerPaths
                    .map(path => `answer_paths=${encodeURIComponent(path)}`)
                    .join('&');

                const gradeUrl = `/grade?${questionPathParams}&${answerPathParams}&temp_data=${encodeURIComponent(JSON.stringify(data.temp_data))}`;
                window.location.href = gradeUrl;
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Error during form submission:', error);
            alert('An error occurred during upload.');
        }
    });
});