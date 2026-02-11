/* ===========================
   USER CREDENTIALS
   Agent Edge Partner Portal
   
   TO ADD A NEW USER:
   1. Run this in browser console:
      simpleHash("theirpassword")
   2. Copy the result
   3. Add line below like:
      "username": "hashresult",
   
   TO REMOVE A USER:
   - Just delete their line
   
   EXAMPLE USERS BELOW:
=========================== */

const credentials = {
  // Demo accounts - REPLACE THESE!
  "demo": "1h7mnb6",           // password: demo123
  "kristy": "1ngf1oi",         // password: test456
  "agent1": "tc9ugn",          // password: welcome
  
  // Add your real agents below:
  // "johnsmith": "abc123xyz",  // Get hash from console
  // "janedoe": "def456uvw",    // Get hash from console
};

/* ===========================
   HOW TO GET A PASSWORD HASH:
   
   1. Open your browser console (F12)
   2. Copy/paste this function:
   
   function simpleHash(str) {
     let hash = 0;
     for (let i = 0; i < str.length; i++) {
       const char = str.charCodeAt(i);
       hash = ((hash << 5) - hash) + char;
       hash = hash & hash;
     }
     return hash.toString(36);
   }
   
   3. Run: simpleHash("agentpassword")
   4. Copy the result
   5. Add to credentials object above
   
=========================== */
