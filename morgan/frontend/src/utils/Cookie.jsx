import Cookies from 'js-cookie';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const setAuthCookie = (key, value, options = {}) => {
  Cookies.set(key, value, {
    expires: options.expires || 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: options.sameSite || 'Strict', 
    ...options,
  });
};

export const getAuthCookie = (key) => {
  return Cookies.get(key);
};

export const removeAuthCookie = (key) => {
  Cookies.remove(key);
};

export const loginUser = async ({ email, password }) => {
  const response = await fetch(`${backendUrl}/api/students/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  setAuthCookie("authToken", data.token);
};

export const registerUser = async ({ name, email, password, grade, district, state }) => {
  const response = await fetch(`${backendUrl}/api/students/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, grade, district, state }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }

  setAuthCookie("authToken", data.token);
};

export const isAuthenticated = () => {
  return !!getAuthCookie('authToken');
};


export const logoutUser = () => {
  removeAuthCookie('authToken');
};
