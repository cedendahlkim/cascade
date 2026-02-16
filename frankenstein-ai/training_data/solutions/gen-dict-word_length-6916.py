# Task: gen-dict-word_length-6916 | Score: 100% | 2026-02-15T08:35:16.615885

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))