import React, { useEffect, useState } from "react";

const BOARD_SIZE = 6;

const initialBoard = [
  ["B", "E", "?", "R", "R", "R"],
  ["E", "R", "?", "R", "?", "E"],
  ["R", "R", "E", "R", "R", "E"],
  ["?", "E", "?", "R", "E", "?"],
  ["E", "R", "R", "?", "E", "R"],
  ["E", "E", "E", "R", "P", "E"],
];

const QUESTIONS = [
  {
    question: "That's the boy ... parents I met.",
    options: ["which", "who", "whom", "whose"],
    answer: "whose",
  },
  {
    question: "I have a friend ... can speak six languages.",
    options: ["which", "who", "whom", "whose"],
    answer: "who",
  },
  {
    question: "The car ... I bought was expensive.",
    options: ["which", "who", "whom", "whose"],
    answer: "which",
  },
  {
    question: "To ... did you give the book?",
    options: ["which", "who", "whom", "whose"],
    answer: "whom",
  },
];

function getNextQuestion(usedQuestions) {
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (!usedQuestions.includes(i)) return { ...QUESTIONS[i], qIndex: i };
  }
  return { ...QUESTIONS[0], qIndex: 0 };
}

function cellContent(v) {
  if (v === "B") return <span role="img" aria-label="bear">🐻</span>;
  if (v === "R") return <span role="img" aria-label="rock">🪨</span>;
  if (v === "?") return <span className="font-bold text-lg">?</span>;
  if (v === "P") return <span role="img" aria-label="honey-pot">🍯</span>;
  return null;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function App() {
  const [bearPos, setBearPos] = useState([0, 0]);
  const [board, setBoard] = useState(deepClone(initialBoard));
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState("playing");
  const [secsLeft, setSecsLeft] = useState(1200);

  useEffect(() => {
    function handleKey(e) {
      if (activeQuestion || gameStatus === "won") return;
      let [row, col] = bearPos;
      let next = [row, col];
      if (e.key === "ArrowRight") next = [row, col + 1];
      if (e.key === "ArrowLeft") next = [row, col - 1];
      if (e.key === "ArrowDown") next = [row + 1, col];
      if (e.key === "ArrowUp") next = [row - 1, col];
      if (
        next[0] < 0 ||
        next[0] >= BOARD_SIZE ||
        next[1] < 0 ||
        next[1] >= BOARD_SIZE
      )
        return;
      if (board[next[0]][next[1]] === "R") return;
      if (board[next[0]][next[1]] === "P") {
        setBearPos(next);
        setGameStatus("won");
        return;
      }
      if (board[next[0]][next[1]] === "?") {
        const { qIndex, ...q } = getNextQuestion(usedQuestions);
        setActiveQuestion({
          row: next[0],
          col: next[1],
          question: q,
          qIndex,
        });
      } else {
        let newBoard = deepClone(board);
        newBoard[bearPos[0]][bearPos[1]] = "E";
        newBoard[next[0]][next[1]] = "B";
        setBoard(newBoard);
        setBearPos(next);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [bearPos, activeQuestion, board, usedQuestions, gameStatus]);

  function answerQuestion(opt) {
    if (!activeQuestion) return;
    const { row, col, question, qIndex } = activeQuestion;
    if (opt === question.answer) {
      setScore(s => s + 1);
    }
    let newBoard = deepClone(board);
    newBoard[bearPos[0]][bearPos[1]] = "E";
    newBoard[row][col] = "B";
    setBoard(newBoard);
    setBearPos([row, col]);
    setActiveQuestion(null);
    setUsedQuestions([...usedQuestions, qIndex]);
  }

  useEffect(() => {
    if (gameStatus !== "playing") return;
    if (secsLeft === 0) setGameStatus("timeout");
    const t = setTimeout(() => setSecsLeft(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearTimeout(t);
  }, [secsLeft, gameStatus]);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#bae6fd",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "row",
        background: "white",
        borderRadius: 12,
        boxShadow: "0 2px 12px #0001",
        overflow: "hidden",
        width: 950,
        height: 630
      }}>
        {/* Left Panel */}
        <div style={{ width: 320, padding: 16, background: "#cffafe" }}>
          <div style={{
            background: "#e0f2fe",
            borderRadius: 8,
            padding: 14,
            marginBottom: 18,
            boxShadow: "0 1px 4px #0001"
          }}>
            <div style={{ fontWeight: "bold", color: "#222", fontSize: 18 }}>🐻 Player</div>
            <div style={{ color: "#64748b", fontSize: 15 }}>Time left</div>
            <div style={{ color: "#be123c", fontWeight: "bold", fontSize: 36 }}>
              {`${String(Math.floor(secsLeft / 60)).padStart(2, "0")}:${String(secsLeft % 60).padStart(2, "0")}`}
            </div>
            <div style={{ marginTop: 4, fontSize: 14, color: "#00875a" }}>Score: {score}</div>
          </div>
          {activeQuestion ? (
            <div style={{
              margin: "0 4px",
              padding: 12,
              background: "#fef9c3",
              borderRadius: 10,
              minHeight: 300
            }}>
              <h3 style={{ fontWeight: "bold", fontSize: 20 }}>Question</h3>
              <div style={{ marginTop: 6, marginBottom: 16, color: "#444" }}>
                {activeQuestion.question.question}
              </div>
              <div>
                {activeQuestion.question.options.map((opt, i) => (
                  <button
                    key={i}
                    style={{
                      display: "block",
                      margin: "12px 0",
                      padding: "12px 18px",
                      width: "100%",
                      background: "#fff",
                      border: "2px solid #fde047",
                      borderRadius: 7,
                      textAlign: "left",
                      fontWeight: 600,
                      fontSize: 18,
                      cursor: "pointer"
                    }}
                    onClick={() => answerQuestion(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              margin: "0 4px",
              marginTop: 18,
              borderRadius: 10,
              background: "#ecfeff",
              padding: 20,
              minHeight: 220,
              color: "#47606e",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17
            }}>
              <span>Use arrow keys to move the bear 🐻.</span>
              <span>Step onto a <span style={{ fontWeight: "bold" }}>?</span> to answer a question!</span>
              {gameStatus === "won" &&
                <span style={{ color: "#00875a", fontWeight: "bold", fontSize: 20, marginTop: 20 }}>You won! 🏆🍯</span>}
              {gameStatus === "timeout" &&
                <span style={{ color: "red", fontWeight: "bold", fontSize: 20, marginTop: 20 }}>Time's up! ⏱️</span>}
            </div>
          )}
        </div>
        {/* Board */}
        <div style={{
          flex: 1,
          background: "#86efac",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}>
          <div style={{
            display: "grid",
            gridTemplateRows: `repeat(${BOARD_SIZE}, 54px)`,
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 54px)`,
            gap: 5,
            padding: 10,
            background: "#bef264",
            borderRadius: 10,
            boxShadow: "0 0 8px #0002"
          }}>
            {Array.from({ length: BOARD_SIZE }).map((_, row) =>
              Array.from({ length: BOARD_SIZE }).map((_, col) => (
                <div
                  key={`${row}-${col}`}
                  style={{
                    width: 54, height: 54, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 8,
                    background:
                      board[row][col] === "R"
                        ? "#e5e7eb"
                        : board[row][col] === "?"
                        ? "#bbf7d0"
                        : board[row][col] === "B"
                        ? "#fef9c3"
                        : board[row][col] === "P"
                        ? "#fcd34d"
                        : "#fff",
                    border:
                      board[row][col] === "?"
                        ? "2px solid #15803d"
                        : board[row][col] === "B"
                        ? "2px solid #f59e42"
                        : board[row][col] === "P"
                        ? "2px solid #fbbf24"
                        : ""
                  }}
                >
                  {cellContent(board[row][col])}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
