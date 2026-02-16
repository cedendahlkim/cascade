# Task: gen-dict-word_length-8232 | Score: 100% | 2026-02-15T08:14:55.721502

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))