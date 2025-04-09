document.addEventListener("DOMContentLoaded", function () {
    let fileText = "";
    let savePdfButton = document.getElementById("downloadPDFBtn");

    if (savePdfButton) {
        savePdfButton.addEventListener("click", saveAsPDF);
    } else {
        console.error("❌ 'downloadPDFBtn' button not found! Check if the ID is correct.");
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    function loadFile() {
        let fileInput = document.getElementById("fileInput");
        let file = fileInput.files[0];

        if (!file) {
            alert("❌ Please select a file!");
            return;
        }

        let fileType = file.name.split('.').pop().toLowerCase();

        if (fileType === "pdf") {
            extractTextFromPDF(file);
        } else if (fileType === "docx") {
            extractTextFromDOCX(file);
        } else {
            alert("❌ Only PDF and DOCX files are supported!");
        }
    }

    function extractTextFromPDF(file) {
        let reader = new FileReader();
        reader.onload = function () {
            let typedarray = new Uint8Array(this.result);

            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                let text = "";
                let pagesPromises = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    pagesPromises.push(pdf.getPage(i).then(page => {
                        return page.getTextContent().then(content => {
                            return content.items.map(item => item.str).join(" ");
                        });
                    }));
                }

                Promise.all(pagesPromises).then(texts => {
                    fileText = texts.join("\n");
                    alert("✅ PDF file loaded successfully!");
                }).catch(err => {
                    console.error("❌ Error extracting PDF:", err);
                    alert("❌ Error extracting PDF content!");
                });
            }).catch(err => {
                alert("❌ Failed to load PDF!");
            });
        };
        reader.readAsArrayBuffer(file);
    }

    function extractTextFromDOCX(file) {
        let reader = new FileReader();
        reader.onload = function () {
            let arrayBuffer = reader.result;

            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(function (result) {
                    fileText = result.value;
                    alert("✅ DOCX file loaded successfully!");
                })
                .catch(function () {
                    alert("❌ Error extracting DOCX content!");
                });
        };
        reader.readAsArrayBuffer(file);
    }

    function analyzeText() {
        if (!fileText) {
            alert("❌ Load a file first!");
            return;
        }

        // Extract Only Topic Names for Key Points
        let keyPoints = [...new Set(fileText.match(/(?:\n|^)([A-Z][a-zA-Z\s]+)(?=\n)/g))] || [];
        keyPoints = keyPoints.map(point => `• ${point.trim()}`);

        // Extended Summary (Covers Every Topic in Simple Language)
        let sentences = fileText.match(/[^.!?]+[.!?]/g) || [fileText];
        let summary = sentences.filter(sentence => sentence.length > 40).slice(0, 70); // Extended to 70 key points
        let formattedSummary = summary.map(line => `<li>${line.trim()}</li>`);

        document.getElementById('keyPoints').innerHTML = keyPoints.join("<br>") || "No key points detected.";
        document.getElementById('summary').innerHTML = `<ul>${formattedSummary.join("")}</ul>` || "No summary available.";
    }

    function generateQuiz() {
        if (!fileText) {
            alert("❌ Load a file first!");
            return;
        }

        let sentences = fileText.match(/[^.!?]+[.!?]/g) || [];
        let numQuestions = sentences.length < 100 ? 10 : sentences.length < 200 ? 20 : 30;
        let questions = [];

        for (let i = 0; i < numQuestions; i++) {
            let questionIndex = Math.floor(Math.random() * sentences.length);
            let questionText = sentences[questionIndex].trim();
            if (questionText.length < 30) continue;

            let correctAnswer = questionText.split(" ").slice(0, 6).join(" "); // More meaningful answers

            let incorrectAnswers = [];
            while (incorrectAnswers.length < 3) {
                let randomSentence = sentences[Math.floor(Math.random() * sentences.length)].trim();
                let randomAnswer = randomSentence.split(" ").slice(0, 6).join(" ");
                if (randomAnswer !== correctAnswer && !incorrectAnswers.includes(randomAnswer)) {
                    incorrectAnswers.push(randomAnswer);
                }
            }

            let options = [correctAnswer, ...incorrectAnswers].sort(() => Math.random() - 0.5);

            let questionHTML = `<li><b>${i + 1}. ${questionText}?</b><br>
                <input type="radio" name="q${i}" value="${options[0]}"> ${options[0]}<br>
                <input type="radio" name="q${i}" value="${options[1]}"> ${options[1]}<br>
                <input type="radio" name="q${i}" value="${options[2]}"> ${options[2]}<br>
                <input type="radio" name="q${i}" value="${options[3]}"> ${options[3]}<br>
            </li>`;
            questions.push(questionHTML);
        }

        document.getElementById("quiz").innerHTML = questions.join("");
    }



   


    // function saveAsPDF() {
    //     const { jsPDF } = window.jspdf;
    
    //     if (!jsPDF) {
    //         console.error("❌ jsPDF is not loaded.");
    //         alert("❌ jsPDF library is missing!");
    //         return;
    //     }
    
    //     let doc = new jsPDF();
    //     let y = 20;
    //     const pageHeight = doc.internal.pageSize.height;  
    
    //     doc.setFontSize(16);
    //     doc.text("📚 Analyzed Document", 10, y);
    //     y += 10; 
    
    //     doc.setFontSize(14);
    //     doc.text("🎯 Key Points:", 10, y);
    //     y += 10;
    
    //     let keyPoints = document.getElementById("keyPoints").innerText;
    //     let splitKeyPoints = doc.splitTextToSize(keyPoints, 180);
    //     doc.setFontSize(12);
    //     doc.text(splitKeyPoints, 10, y);
    //     y += splitKeyPoints.length * 7; 
    
    //     doc.setFontSize(14);
    //     doc.text("📑 Summary:", 10, y);
    //     y += 10;
    
    //     let summary = document.getElementById("summary").innerText;
    //     let splitSummary = doc.splitTextToSize(summary, 180);
    //     doc.setFontSize(12);
    //     doc.text(splitSummary, 10, y);
    //     y += splitSummary.length * 7;
    
    //     doc.setFontSize(14);
    //     doc.text("📝 Quiz:", 10, y);
    //     y += 10;
    
    //     let quiz = document.getElementById("quiz").innerText;
    //     let splitQuiz = doc.splitTextToSize(quiz, 180);
    //     doc.setFontSize(12);
    //     doc.text(splitQuiz, 10, y);
    //     y += splitQuiz.length * 7;
    
    //     doc.save("Analyzed_Document.pdf");
    // }

    function saveAsPDF() {
        const { jsPDF } = window.jspdf;
    
        if (!jsPDF) {
            console.error("❌ jsPDF is not loaded.");
            alert("❌ jsPDF library is missing!");
            return;
        }
    
        let doc = new jsPDF();
        let y = 20; // Starting Y position
        const pageHeight = doc.internal.pageSize.height - 20; // Page height limit (keeping margin)
        const margin = 10;
        const maxWidth = 180;
    
        function addText(title, text) {
            if (y + 10 > pageHeight) {
                doc.addPage();
                y = margin;
            }
            doc.setFontSize(14);
            doc.text(title, margin, y);
            y += 7;
    
            let splitText = doc.splitTextToSize(text, maxWidth);
            doc.setFontSize(12);
    
            splitText.forEach(line => {
                if (y + 7 > pageHeight) {  
                    doc.addPage();
                    y = margin;
                }
                doc.text(line, margin, y);
                y += 7;
            });
    
            y += 5; // Extra spacing between sections
        }
    
        doc.setFontSize(16);
        doc.text("📚 Analyzed Document", margin, y);
        y += 10;
    
        addText("🎯 Key Points:", document.getElementById("keyPoints").innerText);
        addText("📑 Summary:", document.getElementById("summary").innerText);
        addText("📝 Quiz:", document.getElementById("quiz").innerText);
    
        doc.save("Analyzed_Document.pdf");
    }
    
    

    document.getElementById("loadFileBtn").addEventListener("click", loadFile);
    document.getElementById("analyzeTextBtn").addEventListener("click", analyzeText);
    document.getElementById("generateQuizBtn").addEventListener("click", generateQuiz);
    document.getElementById("downloadPDFBtn").addEventListener("click", saveAsPDF);


});
