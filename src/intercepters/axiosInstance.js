import axios from "axios";
import { Modal } from "antd";
import useAuthStore from "../store/store";
import Url from "../store/url";

const api = axios.create({
  baseURL: `${Url}/api`, // Replace with your API's base URL
  timeout: 10000,
});

// Request Interceptor: Attach Bearer Token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
  (response) => response, // Return successful responses
  (error) => {
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401: // Unauthorized Access (Invalid Token)
          Modal.warning({
            title: "Session Expired",
            content: "انت غير مخول لك في الدخول هنا",
            centered: true,
            onOk: () => {
              useAuthStore.getState().logout(); // Clear token
              window.location.href = "/"; // Redirect to login page
            },
          });
          break;

        case 403: // Forbidden (No Permission)
          Modal.error({
            title: "Unauthorized Access",
            content: "You do not have permission to view this page.",
            centered: true,
            onOk: () => {
              window.location.href = "/dashboard"; // Redirect to a safe page
            },
          });
          break;

        case 404: // Not Found
          Modal.error({
            title: "404 - Not Found",
            content: "The resource you are looking for does not exist.",
            centered: true,
          });
          break;

        case 500: // Server Error
          Modal.error({
            title: "Server Error",
            content: "An unexpected error occurred on the server. Please try again later.",
            centered: true,
          });
          break;

        default: // Other Errors
          Modal.error({
            title: "Error",
            content: error.response.data?.message || "An unknown error occurred.",
            centered: true,
          });
      }
    } else {
      // Handle Network Errors
      Modal.error({
        title: "Network Error",
        content: "Unable to connect to the server. Please check your internet connection.",
        centered: true,
      });
    }

    return Promise.reject(error); // Reject the error for further handling if necessary
  }
);

export default api;


/*  عل اغلب نلغيهه */