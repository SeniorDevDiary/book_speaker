"use client";
import { useState, useEffect, useRef } from "react";
import { Select, Button, Typography, Layout, Slider, Input } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  RedoOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { HistoryEntry } from "./ClearHistory/page";

const { Content } = Layout;
const { Paragraph } = Typography;
const { Option } = Select;

const Home = () => {
  const [bookText, setBookText] = useState<string>("");
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [startWord, setStartWord] = useState<string>("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("history") || "[]");
    setHistory(storedHistory);
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis
        .getVoices()
        // .filter((item) => item.lang.includes("en") || item.lang.includes("pl"))
        .filter(
          (item) =>
            item.name.includes("Zosia (Enhanced)") ||
            item.name.includes("Daniel")
        )
        .reverse();

      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();

    if (
      typeof window !== "undefined" &&
      speechSynthesis.onvoiceschanged !== undefined
    ) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Load saved progress
    const savedBook = localStorage.getItem("selectedBook");
    const savedWords = localStorage.getItem("lastWords");
    if (savedBook) {
      setSelectedBook(savedBook);
      loadBook(savedBook);
    }
    if (savedWords) {
      setStartWord(savedWords.split(" ").slice(-1)[0]); // Start from the last word
    }
  }, []);

  const loadBook = async (book: string) => {
    const response = await fetch(`/books/${book}.json`);
    const data = await response.json();
    setBookText(data.text);
  };

  const handleBookChange = (value: string) => {
    setSelectedBook(value);
    localStorage.setItem("selectedBook", value); // Save the selected book in localStorage
    loadBook(value);
  };

  const saveProgress = () => {
    const history = JSON.parse(localStorage.getItem("history") || "[]");

    const book = bookText.split(/\s+/);
    if (book.length < 10) return;

    const lastWords =
      currentWordIndex < 5
        ? book[currentWordIndex] +
          " " +
          book[currentWordIndex + 1] +
          " " +
          book[currentWordIndex + 2]
        : book[currentWordIndex - 2] +
          " " +
          book[currentWordIndex - 1] +
          " " +
          book[currentWordIndex];

    history.push({ selectedBook, lastWords });
    localStorage.setItem("history", JSON.stringify(history));
  };

  const handleSpeak = (startFromWord: string) => {
    if (!bookText || !selectedVoice) return;

    if (speechSynthesis.speaking && !isPaused) {
      speechSynthesis.cancel();
    }

    let textToSpeak = bookText;
    if (startFromWord) {
      const startIndex = bookText
        .toLowerCase()
        .indexOf(startFromWord.toLowerCase());
      if (startIndex !== -1) {
        const precedingText = bookText.slice(0, startIndex);
        const wordsBeforeStart = precedingText.split(/\s+/).length;
        setCurrentWordIndex(wordsBeforeStart - 1);
        textToSpeak = bookText.slice(startIndex);
      } else {
        alert("Word not found. Starting from the beginning.");
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    // utterance.lang = "en";
    utterance.voice =
      voices.find((voice) => voice.name === selectedVoice) || null;
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === "word") {
        const charIndex =
          event.charIndex + (bookText.length - textToSpeak.length);
        const words = bookText.slice(0, charIndex).split(/\s+/);
        setCurrentWordIndex(words.length - 1);
      }
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentWordIndex(-1);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (speechSynthesis.speaking && !isPaused) {
      speechSynthesis.pause();
      setIsPaused(true);
      saveProgress();
    }
  };

  const handleResume = () => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    if (speechSynthesis.speaking || isPaused) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      saveProgress();
    }
  };

  const setLastContinuation = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setSelectedBook(last.selectedBook);
    setStartWord(last.lastWords);
  };

  const highlightedText = bookText.split(/\s+/).map((word, index) => (
    <span
      key={index}
      style={{
        backgroundColor: index === currentWordIndex ? "yellow" : "inherit",
      }}
    >
      {word}{" "}
    </span>
  ));

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh" }}>
      <Content>
        <Link href="/ClearHistory">
          <Button type="link" style={{ marginBottom: "24px" }}>
            Clear History
          </Button>
        </Link>
        <br />
        <br />
        <Button onClick={setLastContinuation}>Continue</Button>
        <br />
        <br />
        <Select
          placeholder="Select a book"
          style={{ width: 200, marginBottom: "24px" }}
          onChange={handleBookChange}
          value={selectedBook}
        >
          <Option value="en">en</Option>
          <Option value="DEIR3_1">DEIR3_1</Option>
          <Option value="DEIR3_2">DEIR3_2</Option>
          <Option value="DEIR3_3">DEIR3_3</Option>
          <Option value="DEIR3_4">DEIR3_4</Option>
          <Option value="DEIR3_5">DEIR3_5</Option>
        </Select>

        {bookText && (
          <>
            <Select
              placeholder="Select Voice"
              style={{ width: 200, marginBottom: "24px" }}
              onChange={(value) => setSelectedVoice(value)}
              value={selectedVoice}
            >
              {voices.map((voice) => (
                <Option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </Option>
              ))}
            </Select>

            <div style={{ marginBottom: "24px" }}>
              <span>Speech Speed: </span>
              <Slider
                min={0.2}
                max={4}
                step={0.1}
                value={speechRate}
                onChange={(value) => setSpeechRate(value)}
                style={{ width: 600, marginLeft: "10px" }}
              />
            </div>

            <Input
              placeholder="Start from word..."
              style={{ width: 200, marginBottom: "24px" }}
              value={startWord}
              onChange={(e) => setStartWord(e.target.value)}
            />

            <Button
              style={{ marginRight: "10px" }}
              icon={<PlayCircleOutlined />}
              onClick={() => handleSpeak(startWord)}
              disabled={isSpeaking && !isPaused}
            >
              Start Speaking
            </Button>

            <Button
              style={{ marginRight: "10px" }}
              icon={<PauseCircleOutlined />}
              onClick={handlePause}
              disabled={!isSpeaking || isPaused}
            >
              Pause
            </Button>

            <Button
              style={{ marginRight: "10px" }}
              icon={<PlayCircleOutlined />}
              onClick={handleResume}
              disabled={!isPaused}
            >
              Resume
            </Button>

            <Button
              icon={<RedoOutlined />}
              onClick={handleStop}
              disabled={!isSpeaking && !isPaused}
            >
              Stop
            </Button>

            <Button icon={<SaveOutlined />} onClick={saveProgress}>
              Save progress
            </Button>

            <Paragraph style={{ whiteSpace: "pre-wrap" }}>
              {highlightedText}
            </Paragraph>
          </>
        )}
      </Content>
    </Layout>
  );
};

export default Home;
