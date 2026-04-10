# PhanMemWindow - Software Distribution Platform

A modern web platform for discovering and sharing software, built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Display Software in Card Layout** - Browse software with images, ratings, and metadata
- **Search Functionality** - Find software by title or description
- **Filter by Category** - Narrow down results by software category
- **Detailed Software Pages** - View complete information about each software
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI** - Built with Tailwind CSS for a beautiful user experience

## 📁 Project Structure

```
/app                    # Next.js app router pages
  /software/[id]        # Dynamic software detail pages
  page.tsx              # Home page with search and filter
/components             # Reusable React components
  SoftwareCard.tsx      # Software card display component
  SearchBar.tsx         # Search and filter component
/data                   # Mock software data
  software.ts           # Sample software database
/types                  # TypeScript type definitions
  software.ts           # Software interface
/public                 # Static assets
.github/                # GitHub specific files
  copilot-instructions.md  # Project documentation
```

## 🛠️ Tech Stack

- **Next.js 16+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React 19+** - UI library

## ⚙️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd phanmemwindow
```

2. Install dependencies:
```bash
npm install
```

## 🏃 Running the Project

Start the development server:
```bash
npm run dev
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

The page will auto-reload as you edit files.

## 📦 Building for Production

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## 📝 Usage

### Home Page
- Browse all available software in a responsive grid
- Use the search bar to find software by name or description
- Filter software by category using the dropdown menu
- Click on any software card to view full details

### Software Detail Page
- View complete information about a software
- See rating, likes, comments, and view count
- Download the software or return to the list

## 🗂️ Adding New Software

To add new software to the platform:

1. Open `/data/software.ts`
2. Add a new entry to the `softwareData` array with the following structure:

```typescript
{
  id: 'unique-id',
  title: 'Software Name',
  description: 'Software description',
  image: 'image-url',
  category: 'Category Name',
  rating: 4.5,
  likes: 100,
  comments: 5,
  views: 1000,
  datePublished: 'DD/MM/YYYY',
  version: '2024',
  downloadUrl: 'download-link'
}
```

## 🎨 Customization

### Colors & Styling
- Edit Tailwind CSS classes in components
- Modify colors in `tailwind.config.ts` if needed

### Mock Data
- Replace placeholder images with real software images
- Update software data in `/data/software.ts`
- Add real download URLs for software

### Adding Features
- Create new components in `/components`
- Add new pages in `/app`
- Update types in `/types/software.ts` as needed

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or suggestions, please open an issue in the repository.

