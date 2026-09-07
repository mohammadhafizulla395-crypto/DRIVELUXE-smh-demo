import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

/**
 * Seed script for DriveLuxe.
 * Run with: bun run prisma/seed.ts
 * Creates an admin user + a curated fleet of 12 cars.
 */

type CarSeed = {
  name: string
  brand: string
  type: 'Sedan' | 'SUV' | 'Sports' | 'Convertible' | 'Electric'
  transmission: 'Automatic' | 'Manual'
  fuel: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid'
  seats: number
  year: number
  pricePerDay: number
  image: string
  features: string
  description: string
  featured: boolean
  rating: number
}

const IMG = {
  sports1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/2e2aeef966e3.jpg',
  sports2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e21532cd85a5.jpg',
  sports3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6f3bc54e713c.jpg',
  suv1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/82823c08bd2d.jpg',
  suv2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a307e5812e01.jpg',
  suv3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8ffc728a1fb5.jpg',
  sedan1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/867c3bd482ac.jpg',
  sedan2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/321202067eeb.jpg',
  sedan3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a3904b963b6c.jpg',
  conv1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3f568394fbd3.webp',
  conv2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e4597ec962a9.jpg',
  conv3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ed73e713c71d.jpg',
  elec1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/fc4a2b846049.jpg',
  elec2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f8f28b84ca4a.jpg',
  elec3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b12c0552909a.jpg',
}

const cars: CarSeed[] = [
  {
    name: '911 Carrera',
    brand: 'Porsche',
    type: 'Sports',
    transmission: 'Automatic',
    fuel: 'Petrol',
    seats: 2,
    year: 2024,
    pricePerDay: 349,
    image: IMG.sports1,
    features: 'Sport Chrono Package, PASM, Bose Sound, Leather Interior, Launch Control',
    description:
      'The iconic 911 Carrera blends motorsport DNA with everyday usability. A flat-six engine, razor-sharp handling, and timeless silhouette make every drive an event.',
    featured: true,
    rating: 4.9,
  },
  {
    name: 'F8 Tributo',
    brand: 'Ferrari',
    type: 'Sports',
    transmission: 'Automatic',
    fuel: 'Petrol',
    seats: 2,
    year: 2023,
    pricePerDay: 599,
    image: IMG.sports2,
    features: 'Twin-Turbo V8, Carbon Ceramic Brakes, Track Telemetry, Racing Seats',
    description:
      'A mid-engine masterpiece paying tribute to the legendary V8. Surgical precision, savage acceleration, and that unmistakable Prancing Horse presence.',
    featured: true,
    rating: 5.0,
  },
  {
    name: 'Huracán EVO',
    brand: 'Lamborghini',
    type: 'Sports',
    transmission: 'Automatic',
    fuel: 'Petrol',
    seats: 2,
    year: 2024,
    pricePerDay: 699,
    image: IMG.sports3,
    features: 'LDVI System, All-Wheel Drive, Magnetorheological Suspension, Y-Shaped Dash',
    description:
      'Naturally aspirated V10 fury wrapped in angular Italian design. The Huracán EVO predicts your inputs and delivers pure emotion at every apex.',
    featured: false,
    rating: 4.8,
  },
  {
    name: 'Range Rover Sport',
    brand: 'Land Rover',
    type: 'SUV',
    transmission: 'Automatic',
    fuel: 'Diesel',
    seats: 7,
    year: 2024,
    pricePerDay: 289,
    image: IMG.suv1,
    features: 'Air Suspension, Terrain Response 2, Meridian Audio, Pano Roof, Heated Seats',
    description:
      'Effortless luxury meets go-anywhere capability. The Range Rover Sport conquers trails and city streets with equal composure and style.',
    featured: true,
    rating: 4.7,
  },
  {
    name: 'X7 xDrive40i',
    brand: 'BMW',
    type: 'SUV',
    transmission: 'Automatic',
    fuel: 'Petrol',
    seats: 7,
    year: 2024,
    pricePerDay: 259,
    image: IMG.suv2,
    features: 'Third Row, Crystal Shifter, Sky Lounge Roof, Massage Seats, Live Cockpit Pro',
    description:
      'BMW flagship SUV with three rows of first-class comfort. Twin-turbo inline-six power, xAWD confidence, and a cabin that hushes the world outside.',
    featured: false,
    rating: 4.6,
  },
  {
    name: 'GV80',
    brand: 'Genesis',
    type: 'SUV',
    transmission: 'Automatic',
    fuel: 'Petrol',
    seats: 5,
    year: 2023,
    pricePerDay: 199,
    image: IMG.suv3,
    features: 'Nappa Leather, 3D Gauge Cluster, Lexicon Audio, Highway Driving Assist',
    description:
      'Korean luxury redefined. The GV80 SUV pairs a bold crest grille with a serene, tech-laden cabin and a velvet ride quality.',
    featured: false,
    rating: 4.5,
  },
  {
    name: 'S 500',
    brand: 'Mercedes-Benz',
    type: 'Sedan',
    transmission: 'Automatic',
    fuel: 'Petrol',
    seats: 5,
    year: 2024,
    pricePerDay: 269,
    image: IMG.sedan1,
    features: 'MBUX, Rear Axle Steering, Burmester 4D, Executive Seats, Air Body Control',
    description:
      'The benchmark luxury sedan. The S-Class glides in whisper-quiet isolation while surrounding you with cutting-edge tech and handcrafted materials.',
    featured: true,
    rating: 4.9,
  },
  {
    name: '7 Series',
    brand: 'BMW',
    type: 'Sedan',
    transmission: 'Automatic',
    fuel: 'Hybrid',
    seats: 5,
    year: 2024,
    pricePerDay: 289,
    image: IMG.sedan2,
    features: 'Theater Screen, Executive Lounge, Iconic Glow Grille, xDrive, Champagne Flutes',
    description:
      'Where flagship luxury meets bold design. The 7 Series offers a rear-cinema screen, reclining executive seats, and a ride tuned for serenity.',
    featured: false,
    rating: 4.7,
  },
  {
    name: 'A8 L',
    brand: 'Audi',
    type: 'Sedan',
    transmission: 'Automatic',
    fuel: 'Petrol',
    seats: 5,
    year: 2023,
    pricePerDay: 229,
    image: IMG.sedan3,
    features: 'Predictive Active Suspension, Bang & Olufsen, Virtual Cockpit, Quattro AWD',
    description:
      'Understated elegance with engineering depth. The A8 L reads the road ahead and adapts in milliseconds, keeping every passenger cosseted.',
    featured: false,
    rating: 4.6,
  },
  {
    name: 'Bentley GTC',
    brand: 'Bentley',
    type: 'Convertible',
    transmission: 'Automatic',
    fuel: 'Petrol',
    seats: 4,
    year: 2024,
    pricePerDay: 799,
    image: IMG.conv1,
    features: 'Diamond Quilted Leather, Naim Audio, Heated Steering Wheel, 200mph Top Speed',
    description:
      'Grand touring at its most decadent. A W12 under the bonnet, hand-stitched hides all around, and a fabric roof that folds in 11 seconds.',
    featured: true,
    rating: 5.0,
  },
  {
    name: 'MX-5 Miata',
    brand: 'Mazda',
    type: 'Convertible',
    transmission: 'Manual',
    fuel: 'Petrol',
    seats: 2,
    year: 2024,
    pricePerDay: 129,
    image: IMG.conv2,
    features: '6-Speed Manual, Rear-Wheel Drive, Skyactiv, Bose Audio, Limited-Slip Diff',
    description:
      'The world favourite roadster, distilled. Lightweight, perfectly balanced, and endlessly playful — the purest driving joy on four wheels.',
    featured: false,
    rating: 4.8,
  },
  {
    name: 'F-Type R-Dynamic',
    brand: 'Jaguar',
    type: 'Convertible',
    transmission: 'Automatic',
    fuel: 'Petrol',
    seats: 2,
    year: 2023,
    pricePerDay: 319,
    image: IMG.conv3,
    features: 'Supercharged V8, Active Exhaust, Configurable Dynamics, Windsor Leather',
    description:
      'British muscle with a soulful supercharged V8. Drop the top, blip the throttle, and let the F-Type sing its baritone aria.',
    featured: false,
    rating: 4.6,
  },
  {
    name: 'Model S Plaid',
    brand: 'Tesla',
    type: 'Electric',
    transmission: 'Automatic',
    fuel: 'Electric',
    seats: 5,
    year: 2024,
    pricePerDay: 299,
    image: IMG.elec1,
    features: '1020 hp, 0-60 in 1.99s, 390mi Range, 17in Display, Autopilot, Glass Roof',
    description:
      'The quickest production car ever made. Tri-motor torque, a minimalist glass cabin, and silent, relentless acceleration that rewrites expectations.',
    featured: true,
    rating: 4.9,
  },
  {
    name: 'i7 xDrive60',
    brand: 'BMW',
    type: 'Electric',
    transmission: 'Automatic',
    fuel: 'Electric',
    seats: 5,
    year: 2024,
    pricePerDay: 319,
    image: IMG.elec2,
    features: 'Theater Screen, Crystal Headlights, 318mi Range, Executive Lounge, Interaction Bar',
    description:
      'Silent flagship electrified. The i7 glides on a cushion of torque while passengers enjoy a rear cinema screen and radiant crystal detailing.',
    featured: false,
    rating: 4.7,
  },
  {
    name: 'EQS 580',
    brand: 'Mercedes-Benz',
    type: 'Electric',
    transmission: 'Automatic',
    fuel: 'Electric',
    seats: 5,
    year: 2024,
    pricePerDay: 309,
    image: IMG.elec3,
    features: 'Hyperscreen, 350mi Range, Rear Steering, Burmester 3D, MBUX',
    description:
      'The electric S-Class. A 56-inch Hyperscreen spans the dash while the cabin isolates you in silent, sustainable luxury.',
    featured: false,
    rating: 4.6,
  },
]

async function main() {
  console.log('🌱 Seeding DriveLuxe...')

  // Admin user
  const adminEmail = 'admin@driveluxe.com'
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } })
  if (!existingAdmin) {
    const password = await bcrypt.hash('admin123', 10)
    await db.user.create({
      data: {
        name: 'DriveLuxe Admin',
        email: adminEmail,
        password,
        role: 'admin',
      },
    })
    console.log('✅ Created admin user (admin@driveluxe.com / admin123)')
  } else {
    console.log('ℹ️  Admin user already exists')
  }

  // Demo customer
  const demoEmail = 'rider@driveluxe.com'
  const existingDemo = await db.user.findUnique({ where: { email: demoEmail } })
  if (!existingDemo) {
    const password = await bcrypt.hash('rider123', 10)
    await db.user.create({
      data: {
        name: 'Alex Rider',
        email: demoEmail,
        password,
        role: 'user',
        phone: '+1 555 0100',
      },
    })
    console.log('✅ Created demo user (rider@driveluxe.com / rider123)')
  } else {
    console.log('ℹ️  Demo user already exists')
  }

  // Cars — reset and recreate for a clean fleet
  const carCount = await db.car.count()
  if (carCount === 0) {
    await db.car.createMany({ data: cars })
    console.log(`✅ Created ${cars.length} cars`)
  } else {
    console.log(`ℹ️  Cars already exist (${carCount}), skipping`)
  }

  // Sample bookings + points + reviews for the demo user (idempotent)
  const demoUser = await db.user.findUnique({ where: { email: demoEmail } })
  const firstCar = await db.car.findFirst({ orderBy: { createdAt: 'asc' } })
  const thirdCar = await db.car.findMany({ take: 3, orderBy: { createdAt: 'asc' } })
  const reviewCar = thirdCar[2] ?? firstCar

  if (demoUser && firstCar && (await db.booking.count()) === 0) {
    const start1 = new Date()
    start1.setDate(start1.getDate() + 5)
    const end1 = new Date(start1)
    end1.setDate(end1.getDate() + 2)
    const days1 = 3
    const price1 = Math.round(days1 * firstCar.pricePerDay * 100) / 100
    const points1 = Math.round(price1)

    const booking1 = await db.booking.create({
      data: {
        userId: demoUser.id,
        carId: firstCar.id,
        startDate: start1,
        endDate: end1,
        totalDays: days1,
        totalPrice: price1,
        pickupLocation: 'Downtown Office',
        status: 'confirmed',
      },
    })

    await db.pointTransaction.create({
      data: {
        userId: demoUser.id,
        amount: points1,
        reason: `Points earned — booking for ${firstCar.brand} ${firstCar.name}`,
        bookingId: booking1.id,
      },
    })
    await db.user.update({
      where: { id: demoUser.id },
      data: { points: { increment: points1 } },
    })

    // A completed past booking
    const start2 = new Date()
    start2.setDate(start2.getDate() - 14)
    const end2 = new Date(start2)
    end2.setDate(end2.getDate() + 1)
    const days2 = 2
    const price2 = Math.round(days2 * firstCar.pricePerDay * 100) / 100
    const points2 = Math.round(price2)

    const booking2 = await db.booking.create({
      data: {
        userId: demoUser.id,
        carId: firstCar.id,
        startDate: start2,
        endDate: end2,
        totalDays: days2,
        totalPrice: price2,
        pickupLocation: 'Airport Terminal',
        status: 'completed',
      },
    })
    await db.pointTransaction.create({
      data: {
        userId: demoUser.id,
        amount: points2,
        reason: `Points earned — booking for ${firstCar.brand} ${firstCar.name}`,
        bookingId: booking2.id,
      },
    })
    await db.user.update({
      where: { id: demoUser.id },
      data: { points: { increment: points2 } },
    })

    console.log('✅ Created sample bookings + points for demo user')
  }

  // Sample review from the demo user
  if (
    demoUser &&
    reviewCar &&
    (await db.review.count()) === 0
  ) {
    await db.review.create({
      data: {
        userId: demoUser.id,
        carId: reviewCar.id,
        rating: 5,
        comment:
          'Absolutely brilliant experience. The car was immaculate and pickup was effortless. This is how rentals should work.',
      },
    })
    console.log('✅ Created sample review')
  }

  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
