# Task: gen-dict-word_length-4554 | Score: 100% | 2026-02-15T07:53:08.876856

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))