# Task: gen-dict-word_length-4055 | Score: 100% | 2026-02-15T13:00:28.073186

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))