# Task: gen-dict-word_length-5893 | Score: 100% | 2026-02-13T18:28:55.275172

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))