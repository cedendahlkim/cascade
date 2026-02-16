# Task: gen-dict-word_length-3132 | Score: 100% | 2026-02-13T18:46:06.279178

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))