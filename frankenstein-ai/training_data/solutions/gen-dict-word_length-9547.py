# Task: gen-dict-word_length-9547 | Score: 100% | 2026-02-13T13:11:38.927892

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))