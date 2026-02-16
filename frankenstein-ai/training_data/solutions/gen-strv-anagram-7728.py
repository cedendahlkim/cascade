# Task: gen-strv-anagram-7728 | Score: 100% | 2026-02-13T09:20:47.980946

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')