# Task: gen-dict-word_length-8607 | Score: 100% | 2026-02-13T11:03:58.349709

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))