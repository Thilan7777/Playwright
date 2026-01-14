class HomePage {
  constructor(page) {
    this.page = page;
    this.processLibraryLink = page.getByRole('link', { name: /Process Library/i });
  }

  async open() {
    await this.page.goto('https://www.processchecker.com/');
  }

  async goToProcessLibrary() {
    await this.processLibraryLink.click();
  }
}

module.exports = HomePage;
