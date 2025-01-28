import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './App.css';

function App() {
  useEffect(() => {
    const pdfjsWorker = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }, []);

  const [selectedFile, setSelectedFile] = useState(null);
  const [convertedImages, setConvertedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageFormat, setImageFormat] = useState('png');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a PDF file');
    }
  };

  const getImageDataUrl = (canvas) => {
    switch (imageFormat) {
      case 'jpeg':
        return canvas.toDataURL('image/jpeg', 0.9);
      case 'webp':
        return canvas.toDataURL('image/webp', 0.9);
      default:
        return canvas.toDataURL('image/png');
    }
  };

  const convertPdfToImages = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file first');
      return;
    }

    setLoading(true);
    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        const images = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.0 }); // reduced scale to 1.0
          
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          const context = canvas.getContext('2d');

          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          const imageUrl = getImageDataUrl(canvas);
          images.push(imageUrl);
        }

        setConvertedImages(images);
        setLoading(false);
      };

      fileReader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error('Conversion error:', error);
      alert('An error occurred during conversion');
      setLoading(false);
    }
  };

  const downloadImage = (imageUrl, pageNumber) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `page-${pageNumber}.${imageFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllImages = async () => {
    const zip = new JSZip();
    
    convertedImages.forEach((imageUrl, index) => {
      const imageData = imageUrl.split('base64,')[1];
      zip.file(`page-${index + 1}.${imageFormat}`, imageData, {base64: true});
    });
    
    const content = await zip.generateAsync({type: 'blob'});
    saveAs(content, `all-pages.zip`);
  };

  return (
    <div className="App">
      <div className='navbar'>
        <div className='navbar-menu'>
          <a href='https://github.com/devdestro' target='_blank'>github</a>
          <a href='https://www.linkedin.com/in/yunus-emre-kuru-a33341217/' target='_blank'>linkedin</a>
          <a href='https://buymeacoffee.com/devdestro' target='_blank'>buymeacoffee</a>
        </div>
      </div>
      <header className="App-header">
        <h1>Easily convert 
        your PDF to image.</h1>
        
        <div className="upload-section">
          <span className='upload-text'>Upload file.</span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
          />
          
          <div className="settings-container">
            <div className="format-control">
              <label>Choose Format:</label>
              <select 
                value={imageFormat} 
                onChange={(e) => setImageFormat(e.target.value)}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            <button 
              onClick={convertPdfToImages}
              disabled={!selectedFile || loading}
              className="convert-button"
            >
              {loading ? 'Converting...' : 'Convert'}
            </button>
          </div>
        </div>

        {convertedImages.length > 0 && (
          <>
            <button 
              onClick={downloadAllImages}
              className="download-all-button"
            >
              Download All Pages as ZIP
            </button>

            <div className="images-section">
              {convertedImages.map((image, index) => (
                <div key={index} className="image-container">
                  <img 
                    src={image} 
                    alt={`Page ${index + 1}`} 
                    onClick={() => downloadImage(image, index + 1)}
                    style={{ cursor: 'pointer' }}
                  />
                  <button 
                    onClick={() => downloadImage(image, index + 1)}
                    className="download-button"
                  >
                    Download Page {index + 1}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;