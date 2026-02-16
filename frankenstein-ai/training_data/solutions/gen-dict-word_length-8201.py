# Task: gen-dict-word_length-8201 | Score: 100% | 2026-02-14T12:05:08.243870

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))