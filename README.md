Simple key-value store
======================

Steps to get it running in OpenShift cloud:

1. Create new NodeJS 0.6 application in OpenShift.
  * Souce Code: https://github.com/raidokaldma/keyval.hammertime.ee.git
2. Add new cartridge: MongoDB
3. Restart your application to pick up MongoDB environment variables:
  * Option 1 (using OpenShift RHC Client Tools):
    * rhc app-restart <your-app>
  * Option 2 (using ssh):
    * ssh ...@<your-app>.rhcloud.com
    * gear restart
