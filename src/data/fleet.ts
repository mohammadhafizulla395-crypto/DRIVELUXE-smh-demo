/**
 * Static fleet used as a read-only fallback.
 *
 * The deployed serverless environment cannot open an SQLite file,
 * so GET /api/cars serves this bundled fleet when the database is
 * unreachable. A real database (Postgres) always takes priority.
 *
 * Source: prisma/seed.ts — regenerate with tools/scripts if the
 * fleet changes.
 */

export type StaticCar = {
  id: string
  name: string
  brand: string
  type: string
  transmission: string
  fuel: string
  seats: number
  year: number
  pricePerDay: number
  image: string
  features: string
  description: string
  available: boolean
  featured: boolean
  archived: boolean
  rating: number
  createdAt: string
  updatedAt: string
}

const RAW = [
  {
    "name": "911 Carrera",
    "brand": "Porsche",
    "type": "Sports",
    "transmission": "Automatic",
    "fuel": "Petrol",
    "features": "Sport Chrono Package, PASM, Bose Sound, Leather Interior, Launch Control",
    "description": "The iconic 911 Carrera blends motorsport DNA with everyday usability. A flat-six engine, razor-sharp handling, and timeless silhouette make every drive an event.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/2e2aeef966e3.jpg",
    "seats": 2,
    "year": 2024,
    "pricePerDay": 349,
    "rating": 4.9,
    "featured": true
  },
  {
    "name": "F8 Tributo",
    "brand": "Ferrari",
    "type": "Sports",
    "transmission": "Automatic",
    "fuel": "Petrol",
    "features": "Twin-Turbo V8, Carbon Ceramic Brakes, Track Telemetry, Racing Seats",
    "description": "A mid-engine masterpiece paying tribute to the legendary V8. Surgical precision, savage acceleration, and that unmistakable Prancing Horse presence.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e21532cd85a5.jpg",
    "seats": 2,
    "year": 2023,
    "pricePerDay": 599,
    "rating": 5.0,
    "featured": true
  },
  {
    "name": "Huracán EVO",
    "brand": "Lamborghini",
    "type": "Sports",
    "transmission": "Automatic",
    "fuel": "Petrol",
    "features": "LDVI System, All-Wheel Drive, Magnetorheological Suspension, Y-Shaped Dash",
    "description": "Naturally aspirated V10 fury wrapped in angular Italian design. The Huracán EVO predicts your inputs and delivers pure emotion at every apex.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6f3bc54e713c.jpg",
    "seats": 2,
    "year": 2024,
    "pricePerDay": 699,
    "rating": 4.8,
    "featured": false
  },
  {
    "name": "Range Rover Sport",
    "brand": "Land Rover",
    "type": "SUV",
    "transmission": "Automatic",
    "fuel": "Diesel",
    "features": "Air Suspension, Terrain Response 2, Meridian Audio, Pano Roof, Heated Seats",
    "description": "Effortless luxury meets go-anywhere capability. The Range Rover Sport conquers trails and city streets with equal composure and style.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/82823c08bd2d.jpg",
    "seats": 7,
    "year": 2024,
    "pricePerDay": 289,
    "rating": 4.7,
    "featured": true
  },
  {
    "name": "X7 xDrive40i",
    "brand": "BMW",
    "type": "SUV",
    "transmission": "Automatic",
    "fuel": "Petrol",
    "features": "Third Row, Crystal Shifter, Sky Lounge Roof, Massage Seats, Live Cockpit Pro",
    "description": "BMW flagship SUV with three rows of first-class comfort. Twin-turbo inline-six power, xAWD confidence, and a cabin that hushes the world outside.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a307e5812e01.jpg",
    "seats": 7,
    "year": 2024,
    "pricePerDay": 259,
    "rating": 4.6,
    "featured": false
  },
  {
    "name": "GV80",
    "brand": "Genesis",
    "type": "SUV",
    "transmission": "Automatic",
    "fuel": "Petrol",
    "features": "Nappa Leather, 3D Gauge Cluster, Lexicon Audio, Highway Driving Assist",
    "description": "Korean luxury redefined. The GV80 SUV pairs a bold crest grille with a serene, tech-laden cabin and a velvet ride quality.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8ffc728a1fb5.jpg",
    "seats": 5,
    "year": 2023,
    "pricePerDay": 199,
    "rating": 4.5,
    "featured": false
  },
  {
    "name": "S 500",
    "brand": "Mercedes-Benz",
    "type": "Sedan",
    "transmission": "Automatic",
    "fuel": "Petrol",
    "features": "MBUX, Rear Axle Steering, Burmester 4D, Executive Seats, Air Body Control",
    "description": "The benchmark luxury sedan. The S-Class glides in whisper-quiet isolation while surrounding you with cutting-edge tech and handcrafted materials.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/867c3bd482ac.jpg",
    "seats": 5,
    "year": 2024,
    "pricePerDay": 269,
    "rating": 4.9,
    "featured": true
  },
  {
    "name": "7 Series",
    "brand": "BMW",
    "type": "Sedan",
    "transmission": "Automatic",
    "fuel": "Hybrid",
    "features": "Theater Screen, Executive Lounge, Iconic Glow Grille, xDrive, Champagne Flutes",
    "description": "Where flagship luxury meets bold design. The 7 Series offers a rear-cinema screen, reclining executive seats, and a ride tuned for serenity.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/321202067eeb.jpg",
    "seats": 5,
    "year": 2024,
    "pricePerDay": 289,
    "rating": 4.7,
    "featured": false
  },
  {
    "name": "A8 L",
    "brand": "Audi",
    "type": "Sedan",
    "transmission": "Automatic",
    "fuel": "Petrol",
    "features": "Predictive Active Suspension, Bang & Olufsen, Virtual Cockpit, Quattro AWD",
    "description": "Understated elegance with engineering depth. The A8 L reads the road ahead and adapts in milliseconds, keeping every passenger cosseted.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a3904b963b6c.jpg",
    "seats": 5,
    "year": 2023,
    "pricePerDay": 229,
    "rating": 4.6,
    "featured": false
  },
  {
    "name": "Bentley GTC",
    "brand": "Bentley",
    "type": "Convertible",
    "transmission": "Automatic",
    "fuel": "Petrol",
    "features": "Diamond Quilted Leather, Naim Audio, Heated Steering Wheel, 200mph Top Speed",
    "description": "Grand touring at its most decadent. A W12 under the bonnet, hand-stitched hides all around, and a fabric roof that folds in 11 seconds.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3f568394fbd3.webp",
    "seats": 4,
    "year": 2024,
    "pricePerDay": 799,
    "rating": 5.0,
    "featured": true
  },
  {
    "name": "MX-5 Miata",
    "brand": "Mazda",
    "type": "Convertible",
    "transmission": "Manual",
    "fuel": "Petrol",
    "features": "6-Speed Manual, Rear-Wheel Drive, Skyactiv, Bose Audio, Limited-Slip Diff",
    "description": "The world favourite roadster, distilled. Lightweight, perfectly balanced, and endlessly playful — the purest driving joy on four wheels.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e4597ec962a9.jpg",
    "seats": 2,
    "year": 2024,
    "pricePerDay": 129,
    "rating": 4.8,
    "featured": false
  },
  {
    "name": "F-Type R-Dynamic",
    "brand": "Jaguar",
    "type": "Convertible",
    "transmission": "Automatic",
    "fuel": "Petrol",
    "features": "Supercharged V8, Active Exhaust, Configurable Dynamics, Windsor Leather",
    "description": "British muscle with a soulful supercharged V8. Drop the top, blip the throttle, and let the F-Type sing its baritone aria.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ed73e713c71d.jpg",
    "seats": 2,
    "year": 2023,
    "pricePerDay": 319,
    "rating": 4.6,
    "featured": false
  },
  {
    "name": "Model S Plaid",
    "brand": "Tesla",
    "type": "Electric",
    "transmission": "Automatic",
    "fuel": "Electric",
    "features": "1020 hp, 0-60 in 1.99s, 390mi Range, 17in Display, Autopilot, Glass Roof",
    "description": "The quickest production car ever made. Tri-motor torque, a minimalist glass cabin, and silent, relentless acceleration that rewrites expectations.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/fc4a2b846049.jpg",
    "seats": 5,
    "year": 2024,
    "pricePerDay": 299,
    "rating": 4.9,
    "featured": true
  },
  {
    "name": "i7 xDrive60",
    "brand": "BMW",
    "type": "Electric",
    "transmission": "Automatic",
    "fuel": "Electric",
    "features": "Theater Screen, Crystal Headlights, 318mi Range, Executive Lounge, Interaction Bar",
    "description": "Silent flagship electrified. The i7 glides on a cushion of torque while passengers enjoy a rear cinema screen and radiant crystal detailing.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f8f28b84ca4a.jpg",
    "seats": 5,
    "year": 2024,
    "pricePerDay": 319,
    "rating": 4.7,
    "featured": false
  },
  {
    "name": "EQS 580",
    "brand": "Mercedes-Benz",
    "type": "Electric",
    "transmission": "Automatic",
    "fuel": "Electric",
    "features": "Hyperscreen, 350mi Range, Rear Steering, Burmester 3D, MBUX",
    "description": "The electric S-Class. A 56-inch Hyperscreen spans the dash while the cabin isolates you in silent, sustainable luxury.",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b12c0552909a.jpg",
    "seats": 5,
    "year": 2024,
    "pricePerDay": 309,
    "rating": 4.6,
    "featured": false
  }
]

export const FLEET: StaticCar[] = RAW.map((c, i) => ({
  ...c,
  id: 'static-' + String(i + 1).padStart(3, '0'),
  available: true,
  archived: false,
  createdAt: new Date(Date.UTC(2025, 0, 1 + i)).toISOString(),
  updatedAt: new Date(Date.UTC(2025, 0, 1 + i)).toISOString(),
}))
