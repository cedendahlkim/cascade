# Task: gen-dict-word_length-3680 | Score: 100% | 2026-02-13T14:18:53.361348

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))