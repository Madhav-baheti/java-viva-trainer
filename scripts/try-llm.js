require('dotenv').config();
const { getValidJson } = require('../src/validate');

(async () => {
  try {
    const result = await getValidJson({
      system: 'You are a JSON API. Reply with JSON only.',
      user: 'Reply with JSON {"ok":true}',
      check: (obj) => {
        if (!obj || obj.ok !== true) throw new Error('expected {"ok":true}');
        return true;
      },
    });
    console.log(result);
  } catch (err) {
    console.error('FAILED:', err.message);
    if (err.cause) console.error('Cause:', err.cause.message);
    process.exit(1);
  }
})();