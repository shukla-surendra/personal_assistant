import http from "../http-common";

const login = data => {
  return http.post("/api/v1/users/login", data);
};

const signup = data => {
  return http.post("http://127.0.0.1:8000/api/v1/users/signup", data);
};

const me = data => {
  return http.get("/api/v1/users/me");
};


const UserService = {
  login, signup, me
};

export default UserService;