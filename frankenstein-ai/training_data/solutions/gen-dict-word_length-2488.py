# Task: gen-dict-word_length-2488 | Score: 100% | 2026-02-13T18:46:06.499428

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))