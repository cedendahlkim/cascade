# Task: gen-dict-word_length-3857 | Score: 100% | 2026-02-13T21:48:43.275619

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))