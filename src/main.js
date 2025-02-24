import React, { useState } from "react";
import './App.css';
import Switch from "react-switch";
import languageCodes from "./languagecode"; // Import language codes


export default function Main() {
  const [theme, setTheme] = useState({
    color: "white",
    background: 'radial-gradient(circle at 10% 20%, rgb(69, 86, 102) 0%, rgb(34, 34, 34) 90%)',
    boxShadow: '-2px 2px 9px 0px rgba(234,228,228,0.75)',
  });

  const toggleTheme = () => {
    setTheme(theme.color === 'white' ? { color: 'black', backgroundColor: 'white' , boxShadow: '-2px 2px 9px 0px rgba(10, 8, 8, 0.75)', } : {
      color: 'white',
      background: 'radial-gradient(circle at 10% 20%, rgb(69, 86, 102) 0%, rgb(34, 34, 34) 90%)',
      boxShadow: '-2px 2px 9px 0px rgba(234,228,228,0.75)',
    });
  };

  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [searched, setSearched] = useState(false);
  const [toLang, setToLang] = useState("en");
  const [translatedData, setTranslatedData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDefinition = async () => {
    if (!search.trim()) return;
    setSearched(true);
    setLoading(true);

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${search}`);
      const jsonData = await response.json();

      if (Array.isArray(jsonData) && jsonData.length > 0) {
        const wordData = jsonData[0];

        setData(wordData);
        if (wordData.meanings?.length > 0) {
          translateDefinition(wordData);
        } else {
          setTranslatedData(null);
        }
      } else {
        setData(null);
        setTranslatedData(null);
      }
    } catch (error) {
      console.error("Error fetching definition:", error);
    }
    finally {
      setLoading(false);  // Stop loading
    }
  };

  const translateDefinition = async (definitionData) => {
    if (!definitionData.meanings || definitionData.meanings.length === 0) {
      setTranslatedData({
        word: definitionData.word,
        partOfSpeech: "N/A",
        definition: "No definition available",
        synonyms: ["No synonyms available"],
        sourceUrls: definitionData.sourceUrls || [],
      });
      return;
    }

    if (toLang === "en") {
      setTranslatedData({
        word: definitionData.word,
        partOfSpeech: definitionData.meanings[0].partOfSpeech || "N/A",
        definition: definitionData.meanings[0].definitions[0]?.definition || "No definition available",
        synonyms: definitionData.meanings[0].synonyms?.length > 0 ? definitionData.meanings[0].synonyms : ["No synonyms available"],
        sourceUrls: definitionData.sourceUrls || [],
      });
      return;
    }

    const firstMeaning = definitionData.meanings[0];
    const translatedWord = await translateText(definitionData.word);
    const translatedDefinition = await translateText(firstMeaning.definitions[0]?.definition || "No definition available");

    let translatedSynonyms = [];
    if (firstMeaning.synonyms?.length > 0) {
      translatedSynonyms = await translateSynonyms(firstMeaning.synonyms);
    }

    setTranslatedData({
      word: translatedWord,
      partOfSpeech: firstMeaning.partOfSpeech || "N/A",
      definition: translatedDefinition,
      synonyms: translatedSynonyms.length > 0 ? translatedSynonyms : ["No synonyms available"],
      sourceUrls: definitionData.sourceUrls || [],
    });
  };

  const translateText = async (text) => {
    if (!text) return "No translation available";

    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${toLang}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      return data.responseData?.translatedText || "Translation not available";
    } catch (error) {
      console.error("Error fetching translation:", error);
      return "Error fetching translation";
    }
  };

  const translateSynonyms = async (synonyms) => {
    if (!synonyms || synonyms.length === 0) return [];
    return Promise.all(synonyms.map((syn) => translateText(syn)));
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="main-center">
      <header className="head">
        <div className="heading">
          <h1>VocabVault</h1>
          <span className="material-symbols-outlined" style={{ color: "white" }}>dictionary</span>
        </div>

        <div className="switch-container">
          <Switch
            onChange={toggleTheme}
            checked={theme.color === 'white'}
            uncheckedIcon={false}
            checkedIcon={false}
            onColor="#000"
            offColor="#ccc"
            handleDiameter={28}
            height={34}
            width={60}
          />
          <span className="switch-label">{theme.color === 'black' ? 'Light Mode' : 'Dark Mode'}</span>
        </div>
      </header>

      <div className="container" style={theme}>
        <div className="searchbar">
          <input type="text" placeholder="Search Word" onChange={(e) => setSearch(e.target.value)} />
          <button onClick={fetchDefinition} style={theme}>Search</button>

          <select value={toLang} onChange={(e) => setToLang(e.target.value)} className="language-dropdown">
            {Object.entries(languageCodes).map(([lang, code]) => (
              <option key={code} value={code}>{lang}</option>
            ))}
          </select>
        </div>

        <div className="datas">
  {loading ? (
    <p>Loading...</p>
  ) : searched && !data ? (
    <p>Not available</p>
  ) : (
    translatedData && (
      <div className="datas">
        <h2>Word: {translatedData.word}</h2>
        <p><strong>Part of Speech:</strong> {translatedData.partOfSpeech}</p>
        <p><strong>Definition:</strong> {translatedData.definition}</p>
        {translatedData.synonyms?.length > 0 && (
          <p><strong>Synonyms:</strong> {translatedData.synonyms.join(', ')}</p>
        )}
        <button onClick={() => speak(translatedData.word)} style={theme}>Pronounce</button>
        <button onClick={() => window.open(translatedData.sourceUrls[0], '_blank')} style={theme}>Read More</button>
      </div>
    )
  )}
</div>

      </div>

      <footer className="footer">
        Made by Arthav Jain<br />
        <br />
        &copy; 2025 VocabVault
      </footer>
    </div>
  );
}
