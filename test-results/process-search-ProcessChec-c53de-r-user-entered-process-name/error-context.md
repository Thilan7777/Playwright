# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]: 🔍 Process Search - Enter Process Name
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]: "Process Name:"
      - textbox "Process Name:" [disabled] [ref=e8]:
        - /placeholder: Enter process name (e.g., chrome.exe)
        - text: GitHub.UI.exe
      - generic [ref=e9]: Enter the exact name of the process you want to search
    - generic [ref=e10]:
      - strong [ref=e11]: "Examples:"
      - text: chrome.exe, EasyBiz.exe, notepad.exe, explorer.exe
    - generic [ref=e12]:
      - button "Cancel" [disabled] [ref=e13] [cursor=pointer]
      - button "Search Process" [disabled] [ref=e14]
    - generic [ref=e15]: 🔄 Searching for GitHub.UI.exe... Please wait.
```