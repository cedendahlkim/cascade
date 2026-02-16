# Task: gen-dict-char_count-8066 | Score: 100% | 2026-02-13T14:41:06.567322

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))