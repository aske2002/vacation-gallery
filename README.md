# Vacation Gallery

A full-stack photo gallery application for organizing vacation photos by trips, with automatic GPS extraction and React Query frontend integration.

## 🌟 Features

- **Trip Organization**: Create and manage vacation trips
- **Photo Upload**: Upload multiple photos with automatic processing
- **GPS Extraction**: Automatic extraction of GPS coordinates from EXIF data
- **Image Processing**: Automatic thumbnail generation and image optimization
- **Modern Frontend**: React + TypeScript + React Query for state management
- **RESTful API**: Complete Express.js backend with SQLite database
- **Type Safety**: Full TypeScript support throughout the stack

## 🏗️ Architecture

### Backend (Express.js + TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: SQLite with comprehensive schema
- **Image Processing**: Sharp for resizing/optimization
- **EXIF Extraction**: exifr for GPS and camera metadata
- **File Uploads**: Multer for multipart handling
- **Error Handling**: Comprehensive error middleware

### Frontend (React + React Query)
- **Framework**: React with TypeScript
- **State Management**: TanStack React Query for server state
- **HTTP Client**: Axios with interceptors
- **UI Components**: Example components with shadcn/ui styling
- **Type Safety**: Full TypeScript integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### 1. Clone and Setup
```bash
git clone <your-repo>
cd vacation-gallery
```

### 2. Start Backend
```bash
# Method 1: Use the helper script
./start-backend.sh

# Method 2: Manual setup
cd backend
npm install
npm run build
npm start
```

The backend will be available at `http://localhost:1798`

### 3. Start Frontend (Optional)
```bash
cd frontend
npm install
npm run dev
```

### 4. Test the API
Open your browser to:
- **Health Check**: http://localhost:1798/api/health
- **All Trips**: http://localhost:1798/api/trips
- **Statistics**: http://localhost:1798/api/statistics

## 📊 API Endpoints

### Trips
- `GET /api/trips` - List all trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/:id` - Get specific trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Photos
- `GET /api/photos` - List all photos
- `POST /api/photos/upload/:tripId` - Upload photos to trip
- `GET /api/photos/:id` - Get specific photo
- `PUT /api/photos/:id` - Update photo metadata
- `DELETE /api/photos/:id` - Delete photo
- `GET /api/images/:filename` - Serve full-size image
- `GET /api/thumbnails/:filename` - Serve thumbnail

### Search & Statistics
- `GET /api/photos/search?q=query` - Search photos
- `GET /api/photos/coordinates` - Photos with GPS coordinates
- `GET /api/photos/location?bounds=...` - Photos within bounds
- `GET /api/photos/date-range?start=...&end=...` - Photos by date
- `GET /api/statistics` - App statistics
- `GET /api/health` - Health check

## 💻 Frontend Usage

### Basic Setup
```tsx
// App.tsx
import { ApiProvider } from './providers/ApiProvider';
import { VacationGalleryApp } from './components/VacationGalleryApp';

function App() {
  return (
    <ApiProvider>
      <VacationGalleryApp />
    </ApiProvider>
  );
}
```

### Using React Query Hooks
```tsx
import {
  useTrips,
  useCreateTrip,
  useUploadPhotos
} from './hooks/useVacationGalleryApi';

function MyComponent() {
  const { data: trips, isLoading } = useTrips();
  const createTrip = useCreateTrip();
  const uploadPhotos = useUploadPhotos();

  const handleCreateTrip = () => {
    createTrip.mutate({
      name: 'New Trip',
      description: 'Description',
      start_date: '2024-01-01'
    });
  };

  return <div>{/* Your UI */}</div>;
}
```

### Direct API Usage
```tsx
import { api } from './api/vacationGalleryApi';

// Create trip
const trip = await api.createTrip({
  name: 'Summer 2024',
  description: 'Beach vacation'
});

// Upload photos with progress
const result = await api.uploadPhotos(
  tripId,
  files,
  { title: 'Beach Photos' },
  (progress) => console.log(`${progress}%`)
);

// Get image URLs
const imageUrl = api.getImageUrl(photo.filename);
const thumbnailUrl = api.getThumbnailUrl(photo.filename);
```

## 🗂️ Project Structure

```
vacation-gallery/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── index.ts           # Main server file
│   │   ├── database.ts        # SQLite database class
│   │   ├── image-utils.ts     # EXIF extraction & processing
│   │   ├── trip-routes.ts     # Trip CRUD endpoints
│   │   └── photo-routes.ts    # Photo upload & management
│   ├── uploads/               # Uploaded images (auto-created)
│   ├── package.json
│   └── API.md                 # Complete API documentation
├── frontend/                   # React frontend (optional)
│   ├── src/
│   │   ├── api/
│   │   │   └── vacationGalleryApi.ts  # Axios API client
│   │   ├── hooks/
│   │   │   └── useVacationGalleryApi.ts # React Query hooks
│   │   ├── providers/
│   │   │   └── ApiProvider.tsx         # Query client provider
│   │   └── components/
│   │       ├── ApiTest.tsx             # Test component
│   │       ├── VacationGalleryApp.tsx  # Main app
│   │       └── VacationGalleryComponents.tsx # Examples
│   ├── FRONTEND_API_GUIDE.md   # Frontend usage guide
│   └── package.json
├── start-backend.sh            # Helper script to start backend
└── README.md                   # This file
```

## 🧪 Testing

### Backend API Testing
```bash
# Test health endpoint
curl http://localhost:1798/api/health

# Create a test trip
curl -X POST http://localhost:1798/api/trips \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Trip","description":"Test description"}'

# Upload photos (replace TRIP_ID)
curl -X POST http://localhost:1798/api/photos/upload/TRIP_ID \
  -F "photos=@/path/to/photo.jpg"
```

### Frontend Testing
The included `ApiTest` component provides a complete UI for testing all functionality:

1. Start the backend server
2. Open the frontend in your browser
3. Use the test interface to create trips, upload photos, and verify functionality

## 📄 Database Schema

### Trips Table
```sql
CREATE TABLE trips (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Photos Table
```sql
CREATE TABLE photos (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    filename TEXT NOT NULL UNIQUE,
    original_filename TEXT NOT NULL,
    title TEXT,
    description TEXT,
    latitude REAL,
    longitude REAL,
    altitude REAL,
    taken_at TEXT,
    camera_make TEXT,
    camera_model TEXT,
    iso INTEGER,
    aperture TEXT,
    shutter_speed TEXT,
    focal_length REAL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
);
```

## 🔧 Configuration

### Backend Configuration
- **Port**: 1798 (configurable via `PORT` environment variable)
- **Database**: SQLite file created at `./vacation_gallery.db`
- **Uploads**: Stored in `./uploads/` directory
- **Thumbnails**: Auto-generated in `./uploads/thumbnails/`

### Frontend Configuration
- **API Base URL**: Configured in `vacationGalleryApi.ts`
- **React Query**: Configured in `ApiProvider.tsx`
- **Default Settings**: 5-minute stale time, 2 retries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
- Check if port 1798 is available
- Ensure Node.js 18+ is installed
- Run `npm install` in the backend directory

**Database errors**
- Delete `vacation_gallery.db` and restart the server
- Check file permissions in the project directory

**Upload failures**
- Ensure the `uploads/` directory exists and is writable
- Check file size limits (default: 10MB per file)
- Verify image format is supported (JPEG, PNG, WebP)

**Frontend connection issues**
- Verify backend is running on `http://localhost:1798`
- Check browser console for CORS errors
- Ensure API base URL is correct in `vacationGalleryApi.ts`

### Development Mode

For development with hot reload:

```bash
# Backend (nodemon)
cd backend
npm run dev

# Frontend (Vite)
cd frontend
npm run dev
```

## 🎯 Next Steps

- [ ] Add user authentication
- [ ] Implement photo tagging
- [ ] Add facial recognition
- [ ] Create mobile app
- [ ] Add cloud storage integration
- [ ] Implement photo sharing
- [ ] Add batch operations
- [ ] Create photo slideshow
- [ ] Add video support
- [ ] Implement photo editing

---

**Happy organizing your vacation memories! 📸✈️**
