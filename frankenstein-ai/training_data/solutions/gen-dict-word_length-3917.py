# Task: gen-dict-word_length-3917 | Score: 100% | 2026-02-14T12:20:04.562753

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))