# <p align="center">🌠 Personal Photography Showcase</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License" />
</p>

---

<p align="center">
  <b>A premium, high-performance web application tailored for a stunning personal gallery experience.</b><br>
  Built with cutting-edge tools to transform your photo collection into a fluid, adaptive, and visually captivating interface.
</p>

---

## 💎 Features at a Glance

### 🎨 High-End Aesthetics
*   **Fluid Motion**: Seamless animations powered by `GSAP`, `Framer Motion`, and `React Spring` for a true cinematic feel.
*   **Modern Glassmorphism**: High-fidelity UI components using `tailwindcss-glassmorphism`.
*   **Masonry Layout**: A dynamic grid that intelligently organizes your photos based on their natural aspect ratio.
*   **Dark Mode Native**: Designed from the ground up to look incredible in low-light environments.

### ⚡ Performance Optimized
*   **Adaptive Quality**: Automatically switches image resolution based on your connection quality (3G/4G/WiFi).
*   **Smart Virtualization**: Efficiently renders large volumes of data using `react-window` without affecting browser performance.
*   **Next-Gen Formats**: Instant loading via **ImageKit** with automatic WebP conversion and caching.

### �️ Personal Privacy
*   **Access Gate**: Simple and effective password protection for personal privacy.
*   **Browsing Security**: Built-in "Security Blur" mode for browsing your private photos in public spaces.

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
Create a `.env` file in the root directory:
```env
# Access Password
VITE_PASSWORD_HERE=your_secure_password

# ImageKit Credentials
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id/
VITE_IMAGEKIT_PATH_PREFIX=/AP/
```

### 3. Development
Fire up the local server:
```bash
pnpm dev
```

---

## � Project Structure

```text
src/
├── components/         # 🧩 Modular React components
│   ├── Gallery/        # 🖼️ Main gallery logic
│   ├── ImageGrid/      # 📱 Masonry grid implementation
│   └── ImageModal/     # 🔍 Immersive image viewer
├── hooks/              # 🪝 Logic & Security hooks
├── services/           # 🌐 ImageKit & API integration
└── App.tsx             # 🏗️ Core Application
```

---

<p align="center">
  <i>Created with ❤️ for premium photography viewing.</i><br>
  Licensed under the <a href="./LICENSE">MIT License</a>.
</p>
