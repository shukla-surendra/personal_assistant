import React from "react";
import Auth from "../../utils/auth"
import Dashboard from "../dashboard/DashboardPage";
import Landing from "./Landing";

function Home() {
  return (
    <>
    {Auth.loggedIn() ? (<Dashboard></Dashboard>) : (<Landing></Landing>)}
    </>
    
  );
}

export default Home;
