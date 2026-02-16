# Task: gen-dict-word_length-5111 | Score: 100% | 2026-02-15T09:01:48.025583

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))