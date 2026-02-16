# Task: gen-dict-word_length-2185 | Score: 100% | 2026-02-15T08:14:24.382449

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))