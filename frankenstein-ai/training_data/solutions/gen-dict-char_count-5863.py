# Task: gen-dict-char_count-5863 | Score: 100% | 2026-02-13T09:20:43.409661

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))