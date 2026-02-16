# Task: gen-dict-word_length-7975 | Score: 100% | 2026-02-15T10:09:50.366088

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))