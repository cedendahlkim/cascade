# Task: gen-dict-char_count-7373 | Score: 100% | 2026-02-15T11:36:46.332989

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))