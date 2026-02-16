# Task: gen-dict-word_length-4890 | Score: 100% | 2026-02-13T11:09:08.910135

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))