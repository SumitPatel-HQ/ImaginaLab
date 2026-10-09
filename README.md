# <p align="center">Imaginalab</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=for-the-badge" alt="License: AGPL-3.0" />
</p>

---

<p align="center">
  A personal photo gallery web application with responsive masonry layouts, animated transitions, and image optimization.
</p>

---

## Features

### Interface and animation
* **Masonry grid.** Arranges photos by their natural aspect ratios with `react-masonry-css`.
* **Animations.** Transitions and card interactions built with GSAP, Framer Motion, and React Spring.
* **Glassmorphic styling.** Frosted translucent layers and depth cues styled with Tailwind CSS.
* **Dark theme.** Low-light color palette configured as the default view.

### Performance
* **Virtual scrolling.** Renders visible items with `react-window` to handle large albums smoothly.
* **ImageKit delivery.** Serves images through ImageKit with WebP compression and CDN caching.
* **Network-adaptive quality.** Adjusts image resolution based on the client connection speed.

### Privacy
* **Password protection.** Restricts gallery access behind an authentication gate.
* **Security blur.** Quick toggle to blur all photos when viewing in public environments.

---

## 🛠️ Built With

| Category | Tools & Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS, Lucide Icons, Glassmorphism |
| **Animations** | GSAP, Framer Motion, React Spring, Vanilla Tilt |
| **Media & Delivery** | ImageKit.io, React Infinite Scroll |
| **Utilities** | Virtualization, Custom Security Hooks |

---

## 🚀 Getting Started

### 1. Installation
Ensure you have **pnpm** installed, then run:
```bash
pnpm install
```

### 2. Environment Setup

> Copy [`.env.example`](./.env.example) to `.env` and configure your credentials before running the app. 


### 3. Development
Fire up the local server:
```bash
pnpm dev
```

---

## 📄 License

This project is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0-or-later)](./LICENSE).

The GNU AGPL-3.0 permits commercial use and redistribution subject to its conditions, including the requirement to make the complete corresponding source code of modified versions available to users interacting with the software remotely over a network.

---

<p align="center">
  Licensed under the <a href="./LICENSE">GNU Affero General Public License v3.0</a> (AGPL-3.0-or-later).
</p>
