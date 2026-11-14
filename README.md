<div align="center">

# ✈️ Travel Website

**A client/server travel website built with Node.js, Express, EJS and MongoDB: users register, log in with their own session, browse destinations by category, keep a personal want-to-go list and search destinations by name.**

[![CI](https://github.com/DanEhab/travel-website/actions/workflows/ci.yml/badge.svg)](https://github.com/DanEhab/travel-website/actions/workflows/ci.yml)
![Course](https://img.shields.io/badge/Course-CSEN503%20Communication%20Networks-1f6feb)
![Semester](https://img.shields.io/badge/Semester-Winter%202024-8957e5)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47a248?logo=mongodb&logoColor=white)

<img src="docs/screenshots/home.png" alt="Home page with the Hiking, Cities and Islands categories" width="820">

</div>

---

## Features

| | |
|---|---|
| **Accounts** | Registration and login, with errors shown on the page for empty fields, taken usernames and wrong passwords. Users are stored in MongoDB. |
| **Sessions** | `express-session` gives every user their own session, so several users can be logged in at once without seeing each other's data. Every page except login and registration requires a login. |
| **Browse** | Three categories (Hiking, Cities, Islands) and six destination pages (Paris, Rome, Santorini, Bali, Inca Trail, Annapurna), each with a photo, a description and an embedded video. |
| **Want-to-go list** | Add a destination from its page. Adding it twice shows a message instead of a duplicate, and the list is saved in the user's MongoDB document. |
| **Search** | A search bar on every page. Matching is case-insensitive and on part of the name (for example *"an"* finds Santorini and Annapurna), and each result links to its page. |

<table>
  <tr>
    <td><img src="docs/screenshots/login.png" alt="Login page"></td>
    <td><img src="docs/screenshots/destination.png" alt="Santorini destination page"></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/wanttogo.png" alt="Want-to-go list"></td>
    <td><img src="docs/screenshots/search.png" alt="Search results for 'an'"></td>
  </tr>
</table>

---

## How it works

```mermaid
flowchart LR
    B["Browser"] -- "HTTP: forms and page requests" --> E["Express server<br/>app.js"]
    E -- "renders" --> V["EJS views"]
    E -- "session cookie" --> S["express-session"]
    E -- "MongoDB driver" --> M[("MongoDB<br/>myDB")]
    M --- U["myCollection<br/>users + want-to-go lists"]
    M --- D["destinations"]
```

- **Server**: [`app.js`](app.js) defines all routes. An `isAuthenticated` middleware protects every page and redirects to `/login` when there is no session.
- **Views**: one EJS template per page in [`views/`](views). The server passes data (search results, the want-to-go list, messages) into the templates.
- **Database**: the official MongoDB Node.js driver (no Mongoose, as the course required). Users and their want-to-go lists live in `myCollection`, and destinations in `destinations`. Search uses a case-insensitive regular expression on the destination name.

---

## Run it

You need **Node.js 18+** and **MongoDB** running on `localhost:27017`.

```console
$ git clone https://github.com/DanEhab/travel-website.git
$ cd travel-website
$ npm install
$ npm run seed      # loads the six destinations into MongoDB
$ npm start         # http://localhost:3000
```

`MONGO_URI`, `PORT` and `SESSION_SECRET` can be set as environment variables.

## Tests

[`test/smoke.test.js`](test/smoke.test.js) drives the running website over HTTP. It checks the login protection, registration and login errors, every page, adding to the want-to-go list (including duplicates), partial and case-insensitive search, "Destination not Found" and logout. GitHub Actions runs it on every push against a real MongoDB.

```console
$ npm test
✔ pages require a login
✔ registration validates its input
✔ login
✔ category and destination pages
✔ want-to-go list
✔ search
✔ logout
```

---

## After the submission

The first commit is the project exactly as submitted in December 2024. Reviewing it later showed a few problems, which the second commit fixes:

- The home page was reachable without logging in, because an earlier route for `/` skipped the login check.
- Registration accepted empty usernames and passwords.
- Errors and "not found" messages were plain-text pages instead of messages inside the site.
- Bootstrap was loaded from an external CDN. It is now served from `node_modules`, so the site looks the same offline.

---

## Team & course

Built for **CSEN503 Introduction to Communication Networks**, German University in Cairo, Winter 2024.

**Team:** Daniel Ehab · Khaled Korayem · Yaseen Gadalla · Youssef · Youssef Yasser
