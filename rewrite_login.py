import re

with open('src/components/LoginPage.tsx', 'r') as f:
    content = f.read()

# 1. Fix onBackToLanding block
pattern1 = re.compile(r'\{onBackToLanding && \(\s*<button.*?</button>\s*(?!\)\})', re.DOTALL)
def repl1(m):
    return m.group(0) + '\n        )}'
content = pattern1.sub(repl1, content)

# 2. Fix mode == 'signup' && ( ... <motion.div> ... </motion.div>
pattern2 = re.compile(r'\{mode === \'signup\' && \(\s*<motion\.div.*?</motion\.div>\s*(?!\)\})', re.DOTALL)
def repl2(m):
    return m.group(0) + '\n              )}'
content = pattern2.sub(repl2, content)

# 3. Fix isLoading ? <Loader2 /> : <> ... </>
pattern3 = re.compile(r'\{isLoading \? \(\s*<Loader2[^>]*/>\s*\) : \(\s*<>\s*<span>.*?</span>\s*<ArrowRight[^>]*/>\s*</>\s*(?!\)\})', re.DOTALL)
def repl3(m):
    return m.group(0) + '\n              )}'
content = pattern3.sub(repl3, content)

with open('src/components/LoginPage.tsx', 'w') as f:
    f.write(content)
