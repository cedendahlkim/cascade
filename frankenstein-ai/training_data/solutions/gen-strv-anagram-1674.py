# Task: gen-strv-anagram-1674 | Score: 100% | 2026-02-13T13:21:52.449436

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')