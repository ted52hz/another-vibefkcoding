import { useEffect, useState } from "react";
import { Button } from "/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "/components/ui/card";

const BOARD_SIZE = 6;

// Board layout: "B"=bear, "R"=rock, "?"=question, "E"=empty, "P"=pot
const initialBoard = [
  ["B", "E", "?", "R", "R", "R"],
  ["E", "R", "?", "R", "?", "E"],
  ["R", "R", "E", "R", "R", "E"],
  ["?", "E", "?", "R", "E", "?"],
  ["E", "R", "R", "?", "E", "R"],
  ["E", "E", "E", "R", "P", "E"],
];

const questionBlocks = [
  { row: 0, col: 2 },
  { row: 1, col: 2 },
  { row: 1, col: 4 },
  { row: 3, col: 0 },
  { row: 3, col: 2 },
  { row: 3, col: 5 },
  { row: 4, col: 3 },
  { row: 5, col: 4 },
];

// Some example questions
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

// Helper to get the next question
function getNextQuestion(usedQuestions) {
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (!usedQuestions.includes(i)) return { ...QUESTIONS[i], qIndex: i };
  }
  // If all questions used, start from first
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

export default function BearGameApp() {
  // Bear pos stored as [row, col]
  const [bearPos, setBearPos] = useState([0, 0]);
  const [board, setBoard] = useState(deepClone(initialBoard));
  
  // null or {row, col, question}
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState("playing"); // "playing", "won"

  // Key handling
  useEffect(() => {
    function handleKey(e) {
      if (activeQuestion || gameStatus === "won") return;
      let [row, col] = bearPos;
      let next = [row, col];
      if (e.key === "ArrowRight") next = [row, col + 1];
      if (e.key === "ArrowLeft") next = [row, col - 1];
      if (e.key === "ArrowDown") next = [row + 1, col];
      if (e.key === "ArrowUp") next = [row - 1, col];
      // Bounds
      if (
        next[0] < 0 ||
        next[0] >= BOARD_SIZE ||
        next[1] < 0 ||
        next[1] >= BOARD_SIZE
      )
        return;
      // Obstacle
      if (board[next[0]][next[1]] === "R") return;

      // If moving to honeypot, win
      if (board[next[0]][next[1]] === "P") {
        setBearPos(next);
        setGameStatus("won");
        return;
      }

      // If question block, open question
      if (board[next[0]][next[1]] === "?") {
        const { qIndex, ...q } = getNextQuestion(usedQuestions);
        setActiveQuestion({
          row: next[0],
          col: next[1],
          question: q,
          qIndex,
        });
      } else {
        // Regular move
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

  // Handle select answer
  function answerQuestion(opt) {
    if (!activeQuestion) return;
    const { row, col, question, qIndex } = activeQuestion;
    let correct = false;
    if (opt === question.answer) {
      setScore(s => s + 1);
      correct = true;
    }
    // Move bear into this cell, remove question mark
    let newBoard = deepClone(board);
    newBoard[bearPos[0]][bearPos[1]] = "E";
    newBoard[row][col] = "B";
    setBoard(newBoard);
    setBearPos([row, col]);
    setActiveQuestion(null);
    setUsedQuestions([...usedQuestions, qIndex]);
  }

  // Timer
  const [secsLeft, setSecsLeft] = useState(1200);
  useEffect(() => {
    if (gameStatus !== "playing") return;
    if (secsLeft === 0) setGameStatus("timeout");
    const t = setTimeout(() => setSecsLeft(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearTimeout(t);
  }, [secsLeft, gameStatus]);

  return (
    <div className="flex h-screen w-full bg-sky-200 items-center justify-center">
      {/* Game Card */}
      <Card className="flex flex-row w-[950px] h-[630px]">
        {/* Left panel */}
        <div className="w-[320px] flex flex-col">
          <div className="bg-cyan-100 rounded-md p-4 m-4 shadow flex flex-col items-center">
            <div className="text-gray-900 text-lg">🐻 Player</div>
            <div className="text-md text-slate-600">Time left</div>
            <div className="text-rose-500 font-bold text-4xl">
              {`${Math.floor(secsLeft / 60)
                .toString()
                .padStart(2, "0")}:${(secsLeft % 60)
                .toString()
                .padStart(2, "0")}`}
            </div>
            <div className="mt-2 text-sm text-green-600">Score: {score}</div>
          </div>
          {activeQuestion ? (
            <Card className="mx-4 mt-2 p-4 bg-yellow-50">
              <CardHeader>
                <CardTitle>Question</CardTitle>
                <CardDescription>
                  {activeQuestion.question.question}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  {activeQuestion.question.options.map((opt, i) => (
                    <Button
                      variant="outline"
                      className="justify-start"
                      key={i}
                      onClick={() => answerQuestion(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col m-4 mt-6 rounded bg-cyan-50 p-6 items-center justify-center text-slate-500 h-[320px]">
              <span>Use arrow keys to move the bear 🐻.</span>
              <span>Step onto a <span className="font-bold">?</span> to answer a question!</span>
              {gameStatus === "won" && (
                <span className="text-green-600 font-bold text-lg mt-4">You won! 🏆🍯</span>
              )}
              {gameStatus === "timeout" && (
                <span className="text-red-500 font-bold text-lg mt-4">Time's up! ⏱️</span>
              )}
            </div>
          )}
        </div>
        {/* Board */}
        <div className="flex-1 relative flex items-center justify-center">
          <div
            className="grid grid-cols-6 grid-rows-6 gap-1 bg-green-300 p-5 rounded-lg shadow-lg"
            style={{ width: 410, height: 410 }}
          >
            {Array.from({ length: BOARD_SIZE }).map((_, row) =>
              Array.from({ length: BOARD_SIZE }).map((_, col) => (
                <div
                  key={`${row}-${col}`}
                  className={`w-14 h-14 flex items-center justify-center rounded
                    bg-white
                    ${board[row][col] === "R"
                      ? "bg-gray-400"
                      : board[row][col] === "?"
                      ? "bg-green-200 border-2 border-green-500"
                      : board[row][col] === "B"
                      ? "bg-yellow-100 border-2 border-yellow-400"
                      : board[row][col] === "P"
                      ? "bg-amber-300 border-2 border-amber-500"
                      : ""}
                  `}
                  style={{
                    boxShadow:
                      board[row][col] === "B"
                        ? "0px 0px 6px #222"
                        : "0px 1px 2px #bbb",
                  }}
                >
                  {cellContent(board[row][col])}
                </div>
              ))
            )}
          </div>
          {/* Trees border */}
          <div className="absolute -top-10 left-3 flex flex-row space-x-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} role="img" aria-label="tree">
                🌳
              </span>
            ))}
          </div>
          <div className="absolute bottom-0 left-3 flex flex-row space-x-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} role="img" aria-label="tree">
                🌳
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
