import re

with open('src/components/LoginPage.tsx', 'r') as f:
    content = f.read()

# Fix onBackToLanding
content = content.replace("          </button>        ", "          </button>\n        )}")

# Fix mode text
content = content.replace(" : 'Join the organization to submit and track requests.'", " : 'Join the organization to submit and track requests.')}")

# Fix inputs
content = content.replace("onChange={(e) => setFullName(e.target.value", "onChange={(e) => setFullName(e.target.value)}")
content = content.replace("onChange={(e) => setCompany(e.target.value", "onChange={(e) => setCompany(e.target.value)}")
content = content.replace("onChange={(e) => setEmail(e.target.value", "onChange={(e) => setEmail(e.target.value)}")
content = content.replace("onChange={(e) => setPassword(e.target.value", "onChange={(e) => setPassword(e.target.value)}")

# Fix show password
content = content.replace("onClick={() => setShowPassword(!showPassword", "onClick={() => setShowPassword(!showPassword)}")

# Fix submit button
content = content.replace("                </>\n                          </button>", "                </>\n              )}\n            </button>")

# Fix toggle
content = content.replace("onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin'", "onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}")

with open('src/components/LoginPage.tsx', 'w') as f:
    f.write(content)

