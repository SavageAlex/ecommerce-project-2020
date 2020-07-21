import axios from "axios";
import { endpoint } from "./constants";

console.log(localStorage.getItem("token"));

export const authAxios = axios.create({
  baseURL: endpoint,
});

authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Token ${token}`;
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// export default function setAuthToken(token) {
//   axios.defaults.headers.common['Authorization'] = '';
//   delete axios.defaults.headers.common['Authorization'];

//   if (token) {
//     axios.defaults.headers.common['Authorization'] = `${token}`;
//   }
// }
