# Task: gen-dict-word_length-2794 | Score: 100% | 2026-02-13T09:20:48.336189

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))