# Task: gen-strv-anagram-7201 | Score: 100% | 2026-02-13T09:51:25.101144

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')