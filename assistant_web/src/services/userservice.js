import http from "../http-common";

const login = data => {
  return http.post("/api/v1/users/login", data);
};

const signup = data => {
  return http.post("/api/v1/users/signup", data);
};

const me = data => {
  return http.get("/api/v1/users/me");
};

const update = (userId, data) => {
  return http.put(`/api/v1/users/${userId}`, data);
};

const remove = (userId) => {
  return http.delete(`/api/v1/users/${userId}`);
};

const UserService = {
  login, signup, me, update, remove
};

export default UserService;