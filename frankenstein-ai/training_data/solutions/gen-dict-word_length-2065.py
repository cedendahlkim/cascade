# Task: gen-dict-word_length-2065 | Score: 100% | 2026-02-13T13:42:58.367073

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))