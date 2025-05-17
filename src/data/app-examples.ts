interface AppExample {
  label: string;
  prompt: string;
}

export const APP_EXAMPLES: AppExample[] = [
  {
    label: "Calculator",
    prompt: "Create a calculator app with a clean modern design. Include basic arithmetic operations (add, subtract, multiply, divide) and a clear button. The calculator should support decimal numbers and display the current calculation.",
  },
  {
    label: "Todo List",
    prompt: "Build a todo list application with the ability to add, complete, and delete tasks. The add button and input should be integrated on one row. Each task should have a checkbox to mark it as complete. Include a clean input field at the top and a list of todos below. Add subtle animations for completing and removing tasks. Make sure the input element colors are appropriate.",
  },
  {
    label: "Weather App",
    prompt: "Design a weather dashboard that shows the current temperature, weather condition, and other metrics like humidity and wind speed. Use weather-appropriate icons and a clean, modern layout with good visual hierarchy.",
  },
  {
    label: "Quiz App",
    prompt: "Create an interactive quiz application with multiple-choice questions. Include a progress indicator, score tracking, and immediate feedback on answers. Make it visually engaging with appropriate spacing and transitions between questions.",
  },
  {
    label: "Meme Maker",
    prompt: "Develop a meme maker with a light minimal theme. The meme text should have a thin black outline. Make use of the canvas element. The meme maker should use https://picsum.photos/ for images. Load a random image when the meme maker opens. The meme maker should allow users to type directly on the image to add the top and bottom text of the meme. The meme maker should allow users to select meme orientation (e.g. horizontal, vertical, square). The meme maker should have a refresh button to load a new image. The meme maker should also allow users to share the meme. The meme maker should also allow users to save the meme.",
  },
  {
    label: "Snake Game",
    prompt: "Develop a classic snake game with arrow key controls. Include a score counter, game over screen, and restart button. The snake should grow when eating food, and the game should end if the snake hits the walls or itself. Make sure it is correct and make the JS implementation simple. The spawning algorithm should spawn within the bounds.",
  },
  {
    label: "Note Taker",
    prompt: "Build a note-taking app with a clean, minimal interface. Include a title field and content area for each note. Add the ability to create new notes and preview existing ones in a side panel. Make sure the input fields have specified text colors consistent with the selected theme. Storing notes should be done correctly. Each note should be a separate entry in the object storage.",
  },
  {
    label: "Recipe Finder",
    prompt: "Design a recipe search interface with filters for cuisine type and dietary restrictions. Show recipe cards with images, cooking time, and difficulty level. Include a detailed view for each recipe. State handling should be done correctly.",
  },
  {
    label: "Chatbot",
    prompt: "Create a chatbot interface with a message history display and input field. Messages should alternate between user and bot, with distinct styling for each. Include typing indicators and message timestamps.",
  },
  {
    label: "Space Invaders",
    prompt: "Create a classic Space Invaders game with rows of descending aliens, a player-controlled ship at the bottom, and protective barriers. Implement alien movement patterns, player shooting mechanics, and increasing difficulty as the game progresses. Include a score system, lives counter, and game over conditions when aliens reach the bottom or the player loses all lives. The aliens should also shoot back.",
  },
  {
    label: "Image Gallery",
    prompt: "Design a responsive image gallery with a grid layout. Include image thumbnails that expand to full size when clicked. Add smooth transitions and a lightbox effect for viewing images.",
  },
  {
    label: "Local Audio Player",
    prompt: "Create a simple audio player that allows users to select and play local audio files. Include a file input for selecting audio files, play/pause button, and a progress bar showing the current playback position. Display the file name and duration of the selected track. Ensure the player works with common audio formats like MP3 and WAV.",
  },
  {
    label: "Video Player",
    prompt: "Build a video player with standard controls (play/pause, volume, fullscreen). Include a progress bar with preview thumbnails and playback speed controls. Add a clean, minimal interface that fades when not in use.",
  },
  {
    label: "Calendar",
    prompt: "Design a monthly calendar view with the ability to navigate between months. Show current date highlight and different styling for weekend days. Include a simple event display system.",
  },
  {
    label: "Kanban Board",
    prompt: "Create a Kanban board with 'To Do', 'In Progress', and 'Done' columns. Include an 'Add Task' button (select which board), task cards with titles and descriptions, and drag-and-drop functionality. Use a clean, responsive design with pastel colors and subtle animations. Make it feature complete. Allow dragging between columns. Use in-browser React rendering using Babel. Make sure the input fields have explicit colors set that are compatible with the theme. Use HTML5 native features for drag-and-drop, verify it works correctly. Populate with some SWE examples.",
  },
  {
    label: "Expense Tracker",
    prompt: "Build an expense tracking app with the ability to add transactions with amounts and categories. Show total balance and category-wise breakdown. Include a simple chart to visualize spending patterns.Make sure the input fields have explicit colors set that are compatible with the theme.",
  },
];
