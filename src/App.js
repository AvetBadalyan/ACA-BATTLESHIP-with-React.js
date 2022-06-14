import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import ChoosePlayerPage from "./Pages/ChoosePlayerPage";
import Welcome from './Pages/Welcome/Welcome';
import MainPage1 from './Pages/MainPage/MainPage1';
import MainPage2 from './Pages/MainPage/MainPage2';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/players" element={<ChoosePlayerPage />} />
          <Route path="/players/player1" element={<MainPage1 />} />
          <Route path="/players/player2" element={<MainPage2 />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
