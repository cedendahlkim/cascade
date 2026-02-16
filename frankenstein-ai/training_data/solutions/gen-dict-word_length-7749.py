# Task: gen-dict-word_length-7749 | Score: 100% | 2026-02-13T11:54:00.316268

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))