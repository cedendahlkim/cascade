# Task: gen-dict-word_length-8410 | Score: 100% | 2026-02-15T07:53:19.309158

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))