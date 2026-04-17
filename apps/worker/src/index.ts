async function main() {
  console.log("worker booted");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
