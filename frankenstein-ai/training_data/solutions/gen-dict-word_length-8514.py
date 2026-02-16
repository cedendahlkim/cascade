# Task: gen-dict-word_length-8514 | Score: 100% | 2026-02-13T12:12:56.143076

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))