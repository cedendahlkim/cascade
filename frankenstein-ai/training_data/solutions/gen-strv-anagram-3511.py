# Task: gen-strv-anagram-3511 | Score: 100% | 2026-02-13T14:00:31.231630

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')