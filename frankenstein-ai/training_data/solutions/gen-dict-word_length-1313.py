# Task: gen-dict-word_length-1313 | Score: 100% | 2026-02-14T12:20:52.871921

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))