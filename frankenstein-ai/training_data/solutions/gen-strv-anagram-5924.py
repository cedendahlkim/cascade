# Task: gen-strv-anagram-5924 | Score: 100% | 2026-02-15T12:29:33.022060

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')