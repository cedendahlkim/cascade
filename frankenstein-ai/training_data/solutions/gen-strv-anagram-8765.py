# Task: gen-strv-anagram-8765 | Score: 100% | 2026-02-13T18:33:52.534262

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')