const USERS_KEY = "wrja.local.users";
const SESSION_KEY = "wrja.local.session";

const defaultAdmin = {
  id: "admin-wrja",
  firstName: "WRJA",
  lastName: "Admin",
  email: "admin@wrja.co.za",
  password: "Admin123!",
  role: "admin",
};

const defaultUser = {
  id: "user-wrja-test",
  firstName: "Test",
  lastName: "User",
  email: "user@wrja.co.za",
  password: "User123!",
  role: "athlete",
};

function readUsers() {
  const storedUsers = localStorage.getItem(USERS_KEY);
  const users = storedUsers ? JSON.parse(storedUsers) : [];
  if (!users.some((user) => user.email === defaultAdmin.email)) {
    users.push(defaultAdmin);
  }
  if (!users.some((user) => user.email === defaultUser.email)) {
    users.push(defaultUser);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users;
}

function toSessionUser(user) {
  return {
    id: user.id,
    email: user.email,
    user_metadata: {
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: `${user.firstName} ${user.lastName}`,
      profile_role: user.role,
    },
  };
}

export function getLocalSession() {
  const storedSession = localStorage.getItem(SESSION_KEY);
  return storedSession ? JSON.parse(storedSession) : null;
}

export function getLocalUsers() {
  return readUsers();
}

export function updateLocalUser(id, changes) {
  const users = readUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) throw new Error("User not found.");

  const email = changes.email.trim().toLowerCase();
  if (users.some((user) => user.id !== id && user.email === email)) {
    throw new Error("An account with this email already exists.");
  }

  const updatedUser = { ...users[index], ...changes, email };
  users[index] = updatedUser;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return updatedUser;
}

export function deleteLocalUser(id) {
  const users = readUsers();
  const user = users.find((candidate) => candidate.id === id);
  if (!user) throw new Error("User not found.");
  if (user.role === "admin") throw new Error("Administrators cannot be deleted.");
  localStorage.setItem(USERS_KEY, JSON.stringify(users.filter((candidate) => candidate.id !== id)));
}

export function signUpLocal(userDetails) {
  const users = readUsers();
  const email = userDetails.email.trim().toLowerCase();
  if (users.some((user) => user.email === email)) {
    throw new Error("An account with this email already exists.");
  }
  const user = {
    id: `user-${crypto.randomUUID()}`,
    ...userDetails,
    email,
    role: userDetails.role || "athlete",
  };
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function signInLocal(email, password) {
  const user = readUsers().find(
    (candidate) =>
      candidate.email === email.trim().toLowerCase() &&
      candidate.password === password
  );
  if (!user) throw new Error("Invalid email or password.");
  const session = { user: toSessionUser(user), profile: user };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function signOutLocal() {
  localStorage.removeItem(SESSION_KEY);
}
