# Task: gen-strv-anagram-3838 | Score: 100% | 2026-02-13T12:35:40.046292

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')