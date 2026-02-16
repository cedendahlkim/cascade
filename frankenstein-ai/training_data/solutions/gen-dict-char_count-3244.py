# Task: gen-dict-char_count-3244 | Score: 100% | 2026-02-15T10:50:58.760348

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))