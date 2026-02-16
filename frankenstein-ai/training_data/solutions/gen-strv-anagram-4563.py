# Task: gen-strv-anagram-4563 | Score: 100% | 2026-02-13T10:39:35.395499

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')