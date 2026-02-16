# Task: gen-dict-word_length-6547 | Score: 100% | 2026-02-13T10:02:58.580438

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))