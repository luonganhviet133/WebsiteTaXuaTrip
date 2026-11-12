import fs from 'node:fs';

const listings = JSON.parse(fs.readFileSync('all-listings.json', 'utf8'));

// Read existing mockData.ts to preserve everything from CLOUD_LANDMARKS onwards
const existing = fs.readFileSync('src/data/mockData.ts', 'utf8');
const landmarksIndex = existing.indexOf('export const CLOUD_LANDMARKS: CloudLandmark[] = [');

if (landmarksIndex === -1) {
  console.error('Could not find CLOUD_LANDMARKS in src/data/mockData.ts');
  process.exit(1);
}

const remainder = existing.substring(landmarksIndex);

const importsHeader = `import { 
  Listing, 
  CloudLandmark,
  Booking,
  Review,
  BusTrip, 
  CloudHuntingForecast, 
  CommunityPost, 
  MemberProfile, 
  PartnerWallet,
  PartnerClaimRequest,
  BookingDispute,
  PromoVoucher,
  ServiceRewardSetting
} from '../types/index.ts';

export const INITIAL_LISTINGS: Listing[] = ${JSON.stringify(listings, null, 2)};

`;

const newContent = importsHeader + remainder;
fs.writeFileSync('src/data/mockData.ts', newContent, 'utf8');
console.log('Successfully updated src/data/mockData.ts with', listings.length, 'listings!');
