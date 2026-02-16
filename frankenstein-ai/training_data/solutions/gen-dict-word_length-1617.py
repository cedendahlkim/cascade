# Task: gen-dict-word_length-1617 | Score: 100% | 2026-02-14T13:11:53.638183

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))