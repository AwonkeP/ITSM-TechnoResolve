import re

with open('src/components/LoginPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("{new Date().getFullYear( TechnoResolve Enterprise", "{new Date().getFullYear()} TechnoResolve Enterprise")

content = content.replace("          </button>\n        \n        <div", "          </button>\n        )}\n        <div")

# If it's missing from AnimatePresence
content = content.replace("</motion.div>\n                          </AnimatePresence>", "</motion.div>\n              )}\n            </AnimatePresence>")

# If it's missing from the end of the form submit button:
content = content.replace("                <>\n                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>\n                  <ArrowRight className=\"size-4\" />\n                </>\n                 \n            </button>", "                <>\n                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>\n                  <ArrowRight className=\"size-4\" />\n                </>\n              )}\n            </button>")

with open('src/components/LoginPage.tsx', 'w') as f:
    f.write(content)

