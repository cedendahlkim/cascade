# Task: gen-dict-word_length-8501 | Score: 100% | 2026-02-15T07:59:43.210765

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))