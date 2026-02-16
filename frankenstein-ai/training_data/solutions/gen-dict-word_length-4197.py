# Task: gen-dict-word_length-4197 | Score: 100% | 2026-02-13T09:12:23.171129

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))