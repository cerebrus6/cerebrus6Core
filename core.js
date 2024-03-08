import dotenv from 'dotenv';
import database_connection from "./db_postgresql.js";

class cerebrus6Core {
  constructor() {
    dotenv.config({ path: dotenv.config({ path: './.env' }).error ? '../.env' : './.env' });
    this.db = new database_connection();
  }

  sayHello() {
    console.log(`Hello from ${this.name}`);
  }

  formatString(inputString) {
    // Step 1: Split the input string by commas
    const elements = inputString.split(',');

    // Step 2: Trim whitespace for each element and remove double quotes
    const cleanedElements = elements.map((element) => {
      // Trim whitespace
      const trimmed = element.trim();
      // Remove double quotes
      return trimmed.replace(/"/g, '');
    });

    // Step 3: Surround each element with double quotes
    // const quotedElements = cleanedElements.map((element) => `"${element}"`);

    // Step 4: Join the elements into a comma-separated string
    const resultString = cleanedElements.join(',');

    return resultString;
  }

  currentDateTime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
}

// module.exports = cerebrus6Core;
export default cerebrus6Core;