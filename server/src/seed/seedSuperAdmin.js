require('dotenv').config();
const { connectDB } = require('../config/db');
const User = require('../models/User');

async function main() {
  await connectDB(process.env.MONGO_URI);

  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@example.com';
  const password = process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.SUPERADMIN_NAME || 'Super Admin';

  const existing = await User.findOne({ email }).select('+passwordHash');
  if (existing) {
    existing.role = 'super_admin';
    existing.name = name;
    await existing.setPassword(password);
    await existing.save();
    console.log('Updated existing super admin:', email);
  } else {
    const user = new User({ name, email, passwordHash: 'tmp', role: 'super_admin' });
    await user.setPassword(password);
    await user.save();
    console.log('Created super admin:', email);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
