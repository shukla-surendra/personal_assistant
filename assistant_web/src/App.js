import React from "react";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import theme from './theme';
// dashboard pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import TasksPage from "./pages/dashboard/TasksPage";
import NotesPage from "./pages/dashboard/NotesPage";
import CalendarPage from "./pages/dashboard/CalendarPage";
import TimeBlockPage from "./pages/dashboard/TimeBlockPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import WikiPage from "./pages/dashboard/WikiPage";
import DatabasePage from "./pages/dashboard/DatabasePage";
import NotionPage from "./pages/dashboard/NotionPage";
import MembersPage from "./pages/dashboard/MembersPage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
// landing pages some page might require login
import Login from "./pages/landing/Login"
import Home from "./pages/landing/Home";
import Signup from "./pages/landing/Signup"
import About from "./pages/landing/About";
import Pricing from "./pages/landing/Pricing";
import Feature from "./pages/landing/Feature";
import PrivacyPolicyPage from './pages/landing/PrivacyPolicyPage'
import TermsOfUse from './pages/landing/TermsOfUse'
import Blog from "./pages/landing/Blog";
import Pomodoro from "./pages/landing/Pomodoro";
import BlogPage from "./pages/landing/BlogPage";
import NewLogin from "./pages/landing/NewLogin"
import NewSignup from "./pages/landing/NewSignup"
import TaskDetailPage from './pages/dashboard/TaskDetailPage';
import SearchTasksPage from './pages/dashboard/SearchTasksPage';
import SearchNotebookPage from './pages/dashboard/SearchNotebookPage';
import TaskPage from './pages/dashboard/TaskPage';
import MemberPage from './pages/member/MemberPage';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Router>
        <Routes>
          <Route path=":slug" element={<BlogPage/>}/>
          <Route path="/" element={<Home/>} />
          <Route path="/dashboard" element={<DashboardPage/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/new-login" element={<NewLogin/>} />
          <Route path="/new-signup" element={<NewSignup/>} />
          <Route path="/pomodoro" element={<Pomodoro/>} />
          <Route path="/about" element={<About/>} />
          <Route path="/feature" element={<Feature/>} />
          <Route path="/pricing" element={<Pricing/>} />
          <Route path="/blogs" element={<Blog/>} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage/>} />
          <Route path="/terms-of-use" element={<TermsOfUse/>} />
          <Route path="/tasks" element={<TasksPage/>} />
          <Route path="/notes" element={<NotesPage/>} />
          <Route path="/calendar" element={<CalendarPage/>} />
          <Route path="/timeblock" element={<TimeBlockPage/>}/>
          <Route path="/reports" element={<ReportsPage/>}/>
          <Route path="/wiki" element={<WikiPage/>}/>
          <Route path="/database" element={<DatabasePage/>}/>
          <Route path="/notion" element={<NotionPage/>}/>
          <Route path="/task/:id" element={<TaskDetailPage/>} />
          <Route path="/search-tasks" element={<SearchTasksPage />} />
          <Route path="/search-notebooks" element={<SearchNotebookPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/workspace-members" element={<MemberPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/page/:task_id" element={<TaskPage />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
