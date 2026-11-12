if (Number(process.versions.node.split(".")[0]) < 24) {
  console.error(
    "Use Node.js 24+ for this project. Install Node LTS and reopen VS Code.",
  );
  process.exit(1);
}
