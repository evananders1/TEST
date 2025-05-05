import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home.js';
import MainScreen from './Hard.jsx';
import './App.css';


function App() {

  return ( <div>
    <BrowserRouter>
      <Routes>
          <Route index element = {<Home/>} /> 
          <Route path="/home" element = {<Home/>} />
          <Route path="/hard" element = {<MainScreen/>} />
         
        </Routes>
  </BrowserRouter>

 
        
  </div>
  );
  }

export default App;
function AudioProcessor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [stems, setStems] = useState("2stems");
  const [responseMessage, setResponseMessage] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setResponseMessage("Please select an audio file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("stems", stems);

    try {
      const res = await fetch("http://localhost:5000/api/process_audio", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResponseMessage(data.message || "Audio processed successfully!");
      } else {
        setResponseMessage(data.error || "Something went wrong.");
      }
    } catch (err) {
      setResponseMessage("An error occurred while processing the audio.");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Audio Stem Splitter</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".mp3,.wav"
          onChange={handleFileChange}
          style={{ marginBottom: 10 }}
        />
        <br />
        <label htmlFor="stems">Choose number of stems:</label>
        <select
          id="stems"
          value={stems}
          onChange={(e) => setStems(e.target.value)}
          style={{ marginLeft: 10, marginBottom: 10 }}
        >
          <option value="2stems">Vocals / Accompaniment (2 Stems)</option>
          <option value="4stems">Vocals / Drums / Bass / Other (4 Stems)</option>
          <option value="5stems">Vocals / Drums / Bass / Piano / Other (5 Stems)</option>
        </select>
        <br />
        <button type="submit">Upload & Process</button>
      </form>

      {responseMessage && <p style={{ marginTop: 20 }}>{responseMessage}</p>}
    </div>
  );
}

// React Component that interacts with YTl
function YouTubeConverter() {
    const [url, setUrl] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
  
    const handleSubmit = async (e) => {
      e.preventDefault();
  
      const res = await fetch('http://localhost:5000/api/youtube_converter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
  
      const data = await res.json();
      setResponseMessage(data.message || data.error);
    };
  
    return (
      <div style={{ padding: 20 }}>
        <h2>YouTube to MP3 Converter</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Paste YouTube URL here"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ width: '300px', marginRight: '10px' }}
          />
          <button type="submit">Convert</button>
        </form>
        {responseMessage && <p style={{ marginTop: 15 }}>{responseMessage}</p>}
      </div>
    );
}

// React Component that interacts with File Upload
function UploadFile() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setResponseMessage("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile); // Attach file to form data

    try {
      // Send file to Flask backend
      const response = await fetch('http://localhost:5000/api/UploadFile', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setResponseMessage(`Success: ${result.message}`);
      } else {
        setResponseMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setResponseMessage('Error uploading file.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".mp3,.wav" onChange={handleFileChange} />
        <button type="submit">Upload File</button>
      </form>
      <p>{responseMessage}</p>
    </div>
  )
};