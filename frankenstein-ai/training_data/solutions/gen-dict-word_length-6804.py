# Task: gen-dict-word_length-6804 | Score: 100% | 2026-02-15T14:00:01.515993

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))