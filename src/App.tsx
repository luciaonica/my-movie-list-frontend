import { Routes, Route } from "react-router-dom";
import './App.css'
import Home from "./pages/Home/Home"
import Footer from "./components/footer/Footer";
import Navigation from "./components/navbar/Navigation";
import About from "./pages/About/About";
import NoMatch from "./pages/NoMatch/NoMatch";
import Login from "./pages/Login/Login";
import Registration from "./pages/Registration/Registration"
import Friends from "./pages/Friends/friends";
import Profile from "./pages/Profile/profile";
import Dashboard from "./pages/Dashboard/dashboard";
import MovieInformation from "./pages/MovieInformation/movieInformation";
import MyWatchLists from "./pages/MyWatchlists/myWatchLists";
import Watchlists from "./pages/Watchlists/watchlists";
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminRoute from "./components/ProtectedRoute/AdminRoute";
import IndividualWatchlist from "./pages/IndividualWatchlist/IndividualWatchlist";
import { UserProvider } from "./context/userAuth";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchResults from "./pages/SearchResults/SearchResults";

function App() {
  return (
    <UserProvider>
    <div className="app-container">
      <div className="page-container">
        <Navigation />
        <ToastContainer />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/watchlists" element={<Watchlists />} />
            <Route path="/profile" element={<Profile />} />
            <Route element={<AdminRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            <Route path="/searchresults/:query" element={<SearchResults />} />
            <Route path="/watchlist/:listId" element={<IndividualWatchlist />} />
            <Route path="/mywatchlists" element={<MyWatchLists />} />
            <Route path="/movieinformation/:titleid" element={<MovieInformation />} />
            <Route path="*" element={<NoMatch />} />
          
          </Routes>
        </main>
      <Footer />
      </div>
    </div>
    </UserProvider>
  );
}

export default App;
