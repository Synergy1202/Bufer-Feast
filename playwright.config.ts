import {defineConfig} from "@playwright/test";
export default defineConfig({
  testDir:"./tests",
  fullyParallel:false,
  workers:1,
  timeout:60000,
  expect:{timeout:15000},
  reporter:[["list"],["json",{outputFile:"test-results/results.json"}]],
  use:{baseURL:process.env.BASE_URL||"http://127.0.0.1:3000",viewport:{width:1440,height:1000},headless:true,trace:"retain-on-failure"},
  webServer:process.env.BASE_URL?undefined:{command:"npm run start -- --port 3000",url:"http://127.0.0.1:3000",reuseExistingServer:true,timeout:120000,env:{ORDER_STORAGE:"local",NEXT_TELEMETRY_DISABLED:"1"}},
});
