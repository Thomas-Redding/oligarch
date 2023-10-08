# Oligarch

## How To Run

1. [Install Node.js](https://nodejs.org/en/download/)

2. Download and cp into this rep.

3. Create the node project and install dependencies

   ```bash
   npm init -y
   npm install ws
   ```

4. Start the server

   ```bash
   node server/app.js
   ```

   If you are running into issues, you might consider using the installed node directly:

   ```bash
   /usr/local/opt/node/bin/node server/app.js
   ```

5. Navigate to http://localhost:3000/room/abc

## There are two branches
1. master - the latest version (using hex tiles)
2. v1 - the original version (using a Risk board)
