# Task: gen-dict-word_length-4064 | Score: 100% | 2026-02-15T12:30:00.405206

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))