const { z } = require('zod');

const createDeviceSchema = z.object({
  assetCode: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2).max(120),
  type: z.enum(['DESKTOP', 'LAPTOP', 'PRINTER', 'PROJECTOR', 'NETWORK', 'OTHER']),
  location: z.string().trim().min(1).max(120),
});

module.exports = { createDeviceSchema };
