import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import ChoosePlayerPage from "./Pages/ChoosePlayerPage";
import Welcome from './Pages/Welcome/Welcome';
import MainPage from './Pages/MainPage/MainPage';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/players" element={<ChoosePlayerPage />} />
          <Route path="/players/player1" element={<MainPage />} />
          <Route path="/players/player2" element={<MainPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
