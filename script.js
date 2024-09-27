// Get the start button and canvas elements from the HTML
const startBtn = document.getElementById("start-btn");
const canvas = document.getElementById("canvas");

// Get the start and checkpoint screens, and the message paragraph within the checkpoint screen
const startScreen = document.querySelector(".start-screen");
const checkpointScreen = document.querySelector(".checkpoint-screen");
const checkpointMessage = document.querySelector(".checkpoint-screen > p");

// Get the 2D rendering context for the canvas
const ctx = canvas.getContext("2d");

// Set the canvas dimensions to fill the browser window
canvas.width = innerWidth;
canvas.height = innerHeight;

// Define a gravity constant for the player's falling effect
const gravity = 0.5;

// A flag to control whether checkpoint collision detection is active
let isCheckpointCollisionDetectionActive = true;

// Function to proportionally size elements based on window height
const proportionalSize = (size) => {
  return innerHeight < 500 ? Math.ceil((size / 500) * innerHeight) : size;
}

// Player class to represent the player character
class Player {
  constructor() {
    this.position = {
      x: proportionalSize(10), // Initial x position
      y: proportionalSize(400), // Initial y position
    };
    this.velocity = {
      x: 0, // Horizontal velocity
      y: 0, // Vertical velocity
    };
    this.width = proportionalSize(40); // Width of the player
    this.height = proportionalSize(40); // Height of the player
  }

  // Method to draw the player on the canvas
  draw() {
    ctx.fillStyle = "#99c9ff"; // Player color
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height); // Draw the player
  }
  
  // Method to update the player's position and handle physics
  update() {
    this.draw(); // Draw the player
    this.position.x += this.velocity.x; // Update horizontal position
    this.position.y += this.velocity.y; // Update vertical position

    // Check if the player is below the bottom of the canvas
    if (this.position.y + this.height + this.velocity.y <= canvas.height) {
      // Prevent the player from moving above the canvas
      if (this.position.y < 0) {
        this.position.y = 0; // Reset to the top if above
        this.velocity.y = gravity; // Start falling
      }
      // Apply gravity to the vertical velocity
      this.velocity.y += gravity;
    } else {
      this.velocity.y = 0; // Reset vertical velocity if on the ground
    }

    // Prevent player from moving off the left edge
    if (this.position.x < this.width) {
      this.position.x = this.width;
    }

    // Prevent player from moving off the right edge
    if (this.position.x >= canvas.width - this.width * 2) {
      this.position.x = canvas.width - this.width * 2;
    }
  }
}

// Platform class to represent ground or other surfaces
class Platform {
  constructor(x, y) {
    this.position = {
      x, // X position of the platform
      y, // Y position of the platform
    };
    this.width = 200; // Fixed width of the platform
    this.height = proportionalSize(40); // Height based on screen size
  }

  // Method to draw the platform
  draw() {
    ctx.fillStyle = "#acd157"; // Platform color
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height); // Draw the platform
  }
}

// CheckPoint class to represent checkpoints the player can claim
class CheckPoint {
  constructor(x, y, z) {
    this.position = {
      x, // X position of the checkpoint
      y, // Y position of the checkpoint
    };
    this.width = proportionalSize(40); // Width of the checkpoint
    this.height = proportionalSize(70); // Height of the checkpoint
    this.claimed = false; // Status of the checkpoint (claimed or not)
  };

  // Method to draw the checkpoint
  draw() {
    ctx.fillStyle = "#f1be32"; // Checkpoint color
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height); // Draw the checkpoint
  }

  // Method to claim the checkpoint, effectively removing it from the game
  claim() {
    this.width = 0; // Set width to 0 to make it disappear
    this.height = 0; // Set height to 0 to make it disappear
    this.position.y = Infinity; // Move the position off-screen
    this.claimed = true; // Mark the checkpoint as claimed
  }
}

// Instantiate a player object
const player = new Player();

// Define positions for platforms
const platformPositions = [
  { x: 500, y: proportionalSize(450) },
  { x: 700, y: proportionalSize(400) },
  { x: 850, y: proportionalSize(350) },
  { x: 900, y: proportionalSize(350) },
  { x: 1050, y: proportionalSize(150) },
  { x: 2500, y: proportionalSize(450) },
  { x: 2900, y: proportionalSize(400) },
  { x: 3150, y: proportionalSize(350) },
  { x: 3900, y: proportionalSize(450) },
  { x: 4200, y: proportionalSize(400) },
  { x: 4400, y: proportionalSize(200) },
  { x: 4700, y: proportionalSize(150) },
];

// Create platform objects from the defined positions
const platforms = platformPositions.map(
  (platform) => new Platform(platform.x, platform.y)
);

// Define positions for checkpoints
const checkpointPositions = [
  { x: 1170, y: proportionalSize(80), z: 1 },
  { x: 2900, y: proportionalSize(330), z: 2 },
  { x: 4800, y: proportionalSize(80), z: 3 },
];

// Create checkpoint objects from the defined positions
const checkpoints = checkpointPositions.map(
  (checkpoint) => new CheckPoint(checkpoint.x, checkpoint.y, checkpoint.z)
);

// Animation function to continuously update the canvas
const animate = () => {
  requestAnimationFrame(animate); // Call animate again for the next frame
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  // Draw all platforms
  platforms.forEach((platform) => {
    platform.draw();
  });

  // Draw all checkpoints
  checkpoints.forEach(checkpoint => {
    checkpoint.draw();
  });

  // Update the player state
  player.update();

  // Handle player movement based on key presses
  if (keys.rightKey.pressed && player.position.x < proportionalSize(400)) {
    player.velocity.x = 5; // Move player right
  } else if (keys.leftKey.pressed && player.position.x > proportionalSize(100)) {
    player.velocity.x = -5; // Move player left
  } else {
    player.velocity.x = 0; // Stop horizontal movement

    // Adjust platforms and checkpoints based on player movement
    if (keys.rightKey.pressed && isCheckpointCollisionDetectionActive) {
      platforms.forEach((platform) => {
        platform.position.x -= 5; // Scroll platforms left
      });

      checkpoints.forEach((checkpoint) => {
        checkpoint.position.x -= 5; // Scroll checkpoints left
      });
    
    } else if (keys.leftKey.pressed && isCheckpointCollisionDetectionActive) {
      platforms.forEach((platform) => {
        platform.position.x += 5; // Scroll platforms right
      });

      checkpoints.forEach((checkpoint) => {
        checkpoint.position.x += 5; // Scroll checkpoints right
      });
    }
  }

  // Collision detection with platforms
  platforms.forEach((platform) => {
    const collisionDetectionRules = [
      player.position.y + player.height <= platform.position.y, // Check if above the platform
      player.position.y + player.height + player.velocity.y >= platform.position.y, // Check if falling onto the platform
      player.position.x >= platform.position.x - player.width / 2, // Check if within horizontal bounds
      player.position.x <= platform.position.x + platform.width - player.width / 3, // Check if within horizontal bounds
    ];

    // If all rules are true, stop vertical velocity
    if (collisionDetectionRules.every((rule) => rule)) {
      player.velocity.y = 0; // Reset vertical velocity to prevent falling
      return; // Exit the loop to prevent further checks
    }

    // Additional collision detection rules for landing on the platform
    const platformDetectionRules = [
      player.position.x >= platform.position.x - player.width / 2, // Check if within horizontal bounds
      player.position.x <= platform.position.x + platform.width - player.width / 3, // Check if within horizontal bounds
      player.position.y + player.height >= platform.position.y, // Check if touching the platform from above
      player.position.y <= platform.position.y + platform.height, // Check if within vertical bounds
    ];

    // If all landing rules are true, set player on top of platform
    if (platformDetectionRules.every(rule => rule)) {
      player.position.y = platform.position.y + player.height; // Position player on top of the platform
      player.velocity.y = gravity; // Set vertical velocity to gravity to fall
    };
  });

  // Check for checkpoint collisions
  checkpoints.forEach((checkpoint, index, checkpoints) => {
    const checkpointDetectionRules = [
      player.position.x >= checkpoint.position.x, // Player must be to the right of the checkpoint
      player.position.y >= checkpoint.position.y, // Player must be below the checkpoint
      player.position.y + player.height <= checkpoint.position.y + checkpoint.height, // Player must be above the bottom of the checkpoint
      isCheckpointCollisionDetectionActive, // Check if checkpoint detection is active
      player.position.x - player.width <= checkpoint.position.x - checkpoint.width + player.width * 0.9, // Check if player is within width bounds
      index === 0 || checkpoints[index - 1].claimed === true, // Check if previous checkpoint is claimed (if not the first)
    ];

    // If all checkpoint rules are true, claim the checkpoint
    if (checkpointDetectionRules.every((rule) => rule)) {
      checkpoint.claim(); // Claim the checkpoint

      // Check if the last checkpoint was reached
      if (index === checkpoints.length - 1) {
        isCheckpointCollisionDetectionActive = false; // Disable further checkpoint detection
        showCheckpointScreen("You reached the final checkpoint!"); // Display final checkpoint message
        movePlayer("ArrowRight", 0, false); // Stop player movement
      } else if (player.position.x >= checkpoint.position.x && player.position.x <= checkpoint.position.x + 40) {
        showCheckpointScreen("You reached a checkpoint!"); // Display intermediate checkpoint message
      }
    };
  });
}

// Object to manage key states
const keys = {
  rightKey: {
    pressed: false // State of right key
  },
  leftKey: {
    pressed: false // State of left key
  }
};

// Function to manage player movement based on key presses
const movePlayer = (key, xVelocity, isPressed) => {
  // If checkpoint collision detection is inactive, stop the player
  if (!isCheckpointCollisionDetectionActive) {
    player.velocity.x = 0; // Stop horizontal movement
    player.velocity.y = 0; // Stop vertical movement
    return; // Exit function
  }

  // Determine which key is pressed and adjust velocity accordingly
  switch (key) {
    case "ArrowLeft":
      keys.leftKey.pressed = isPressed; // Update left key state
      if (xVelocity === 0) {
        player.velocity.x = xVelocity; // Apply velocity
      }
      player.velocity.x -= xVelocity; // Move player left
      break;
    case "ArrowUp":
    case " ":
    case "Spacebar":
      player.velocity.y -= 8; // Jump effect
      break;
    case "ArrowRight":
      keys.rightKey.pressed = isPressed; // Update right key state
      if (xVelocity === 0) {
        player.velocity.x = xVelocity; // Apply velocity
      }
      player.velocity.x += xVelocity; // Move player right
  }
}

// Function to start the game when the start button is clicked
const startGame = () => {
  canvas.style.display = "block"; // Show the canvas
  startScreen.style.display = "none"; // Hide the start screen
  animate(); // Begin the animation loop
}

// Function to show a message when reaching a checkpoint
const showCheckpointScreen = (msg) => {
  checkpointScreen.style.display = "block"; // Display the checkpoint screen
  checkpointMessage.textContent = msg; // Set the message text
  if (isCheckpointCollisionDetectionActive) {
    setTimeout(() => (checkpointScreen.style.display = "none"), 2000); // Hide after 2 seconds if active
  }
};

// Event listener for starting the game
startBtn.addEventListener("click", startGame);

// Event listener for keydown events to move the player
window.addEventListener("keydown", ({ key }) => {
  movePlayer(key, 8, true); // Call movePlayer function on key press
});

// Event listener for keyup events to stop player movement
window.addEventListener("keyup", ({ key }) => {
  movePlayer(key, 0, false); // Call movePlayer function on key release
});
